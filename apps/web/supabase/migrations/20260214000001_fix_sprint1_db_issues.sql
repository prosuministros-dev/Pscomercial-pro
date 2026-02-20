-- ============================================================================
-- PSCOMERCIAL-PRO - SPRINT 1 DATABASE FIXES
-- Migration: 20260214000001_fix_sprint1_db_issues.sql
-- Date: 2026-02-14
-- Description: Fixes found during Sprint 1 audit
--   1. Add SECURITY DEFINER to reassign_leads_on_deactivation()
--   2. Fix redundant COALESCE in create_quote_from_lead()
--   3. Add request_margin_approval() function
--   4. Add validate_credit_limit() function
-- ============================================================================


-- ============================================================================
-- FIX 1: Add SECURITY DEFINER to reassign_leads_on_deactivation()
-- Original migration: 20260213020002_auto_assign_lead.sql
-- Issue: Trigger function was missing SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION reassign_leads_on_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger if is_active changed from true to false
  IF NEW.is_active = false AND OLD.is_active = true THEN

    -- Update all pending/assigned leads: unassign and set to created status
    UPDATE leads
    SET
      assigned_to = NULL,
      status = 'created',
      updated_at = now()
    WHERE assigned_to = NEW.id
      AND status IN ('pending_assignment', 'assigned', 'pending_info')
      AND organization_id = NEW.organization_id
      AND deleted_at IS NULL;

    -- Log reassignment events
    INSERT INTO lead_assignments_log (
      organization_id,
      lead_id,
      from_user_id,
      to_user_id,
      assignment_type,
      reason,
      performed_by
    )
    SELECT
      NEW.organization_id,
      l.id,
      NEW.id,
      NULL,
      'reassignment',
      'Advisor deactivated - lead unassigned for auto-reassignment',
      NEW.id
    FROM leads l
    WHERE l.assigned_to IS NULL
      AND l.status = 'created'
      AND l.organization_id = NEW.organization_id
      AND l.updated_at >= now() - INTERVAL '1 second'
      AND l.deleted_at IS NULL;

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION reassign_leads_on_deactivation IS
'Unassigns all pending leads when an advisor is deactivated. SECURITY DEFINER for RLS consistency.';


-- ============================================================================
-- FIX 2: Fix redundant COALESCE in create_quote_from_lead()
-- Original: COALESCE(lead_record.customer_id, lead_record.customer_id)
-- Fix: Direct assignment + customer_id validation
-- ============================================================================

CREATE OR REPLACE FUNCTION create_quote_from_lead(
  lead_uuid uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_quote_id uuid;
  lead_record record;
  quote_num integer;
BEGIN
  -- Get lead information
  SELECT * INTO lead_record
  FROM leads
  WHERE id = lead_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found: %', lead_uuid;
  END IF;

  -- Validate that lead has a customer_id before creating a quote
  IF lead_record.customer_id IS NULL THEN
    RAISE EXCEPTION 'Lead % does not have a customer assigned. Convert the lead to a customer first.', lead_uuid
      USING ERRCODE = 'check_violation';
  END IF;

  -- Check if quote already exists for this lead
  IF lead_record.status = 'converted' THEN
    SELECT id INTO new_quote_id
    FROM quotes
    WHERE lead_id = lead_uuid
    LIMIT 1;

    IF FOUND THEN
      RETURN new_quote_id;
    END IF;
  END IF;

  -- Generate quote number
  quote_num := generate_consecutive(lead_record.organization_id, 'quote');

  -- Create the quote
  INSERT INTO quotes (
    organization_id,
    quote_number,
    lead_id,
    customer_id,
    advisor_id,
    quote_date,
    validity_days,
    expires_at,
    status,
    currency,
    payment_terms,
    subtotal,
    tax_amount,
    total,
    created_by
  )
  VALUES (
    lead_record.organization_id,
    quote_num,
    lead_uuid,
    lead_record.customer_id,  -- Fixed: was COALESCE(customer_id, customer_id)
    lead_record.assigned_to,
    now(),
    30,
    now() + interval '30 days',
    'draft',
    'COP',
    'ANTICIPADO',
    0,
    0,
    0,
    lead_record.created_by
  )
  RETURNING id INTO new_quote_id;

  -- Update lead status to converted
  IF lead_record.status != 'converted' THEN
    UPDATE leads
    SET status = 'converted',
        converted_at = now(),
        customer_id = lead_record.customer_id
    WHERE id = lead_uuid;
  END IF;

  RETURN new_quote_id;
END;
$$;

COMMENT ON FUNCTION create_quote_from_lead IS
'Creates a new quote from a lead. Validates customer_id exists. Fixed redundant COALESCE.';

GRANT EXECUTE ON FUNCTION create_quote_from_lead TO authenticated;
GRANT EXECUTE ON FUNCTION create_quote_from_lead TO service_role;


-- ============================================================================
-- FIX 3: Add pending_approval to quote status constraint
-- ============================================================================

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS chk_quote_status;
ALTER TABLE quotes ADD CONSTRAINT chk_quote_status
  CHECK (status IN (
    'draft',
    'pending_approval',
    'offer_created',
    'negotiation',
    'risk',
    'pending_oc',
    'approved',
    'rejected',
    'lost',
    'expired'
  ));


-- ============================================================================
-- NEW 3: request_margin_approval(p_quote_id uuid)
-- ============================================================================

CREATE OR REPLACE FUNCTION request_margin_approval(p_quote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote record;
  v_caller_id uuid;
  v_caller_org uuid;
  v_margin_pct numeric(5,2);
  v_min_margin numeric(5,2);
  v_needs_approval boolean := false;
  v_payment_type text;
  v_approver_role text;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT organization_id INTO v_caller_org
  FROM profiles WHERE id = v_caller_id;

  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found: %', p_quote_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_quote.organization_id != v_caller_org THEN
    RAISE EXCEPTION 'Quote does not belong to your organization'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Recalculate totals
  PERFORM calculate_quote_totals(p_quote_id);

  SELECT margin_pct INTO v_margin_pct FROM quotes WHERE id = p_quote_id;

  IF v_margin_pct IS NULL THEN
    RAISE EXCEPTION 'Cannot determine margin for quote %', p_quote_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- Map payment_terms to margin_rules payment_type
  v_payment_type := CASE
    WHEN v_quote.payment_terms IN ('ANTICIPADO', 'CONTRA_ENTREGA') THEN 'anticipated'
    WHEN v_quote.payment_terms IN ('CREDITO_8', 'CREDITO_15', 'CREDITO_30') THEN 'credit_30'
    WHEN v_quote.payment_terms IN ('CREDITO_45', 'CREDITO_60') THEN 'credit_60'
    WHEN v_quote.payment_terms = 'CREDITO_90' THEN 'credit_90'
    ELSE 'anticipated'
  END;

  -- Find strictest minimum margin across all items
  SELECT COALESCE(MAX(mr.requires_approval_below), 0)
  INTO v_min_margin
  FROM quote_items qi
  JOIN products p ON p.id = qi.product_id
  JOIN margin_rules mr ON mr.category_id = p.category_id
    AND mr.organization_id = v_quote.organization_id
    AND mr.payment_type = v_payment_type
    AND mr.is_active = true
    AND (mr.effective_until IS NULL OR mr.effective_until >= CURRENT_DATE)
    AND mr.effective_from <= CURRENT_DATE
  WHERE qi.quote_id = p_quote_id;

  IF v_min_margin IS NULL OR v_min_margin = 0 THEN
    v_min_margin := 5.00;
  END IF;

  v_needs_approval := (v_margin_pct < v_min_margin);

  IF NOT v_needs_approval THEN
    UPDATE quotes
    SET margin_approved = true,
        margin_approved_by = v_caller_id,
        margin_approved_at = now(),
        updated_at = now()
    WHERE id = p_quote_id;
    RETURN;
  END IF;

  -- Margin below minimum: trigger approval workflow
  UPDATE quotes
  SET status = 'pending_approval',
      margin_approved = false,
      updated_at = now()
  WHERE id = p_quote_id;

  -- Find approver role from strictest margin rule
  SELECT mr.approval_role_slug INTO v_approver_role
  FROM quote_items qi
  JOIN products p ON p.id = qi.product_id
  JOIN margin_rules mr ON mr.category_id = p.category_id
    AND mr.organization_id = v_quote.organization_id
    AND mr.payment_type = v_payment_type
    AND mr.is_active = true
    AND (mr.effective_until IS NULL OR mr.effective_until >= CURRENT_DATE)
    AND mr.effective_from <= CURRENT_DATE
  WHERE qi.quote_id = p_quote_id
  ORDER BY mr.requires_approval_below DESC
  LIMIT 1;

  v_approver_role := COALESCE(v_approver_role, 'gerente_comercial');

  -- Notify approvers
  INSERT INTO notifications (
    organization_id, user_id, type, title, message,
    action_url, entity_type, entity_id, priority
  )
  SELECT
    v_quote.organization_id, ur.user_id, 'quote_approval',
    'Aprobacion de margen requerida',
    'Cotizacion #' || v_quote.quote_number || ' margen ' || v_margin_pct || '% (min: ' || v_min_margin || '%)',
    '/quotes/' || p_quote_id, 'quote', p_quote_id, 'high'
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.organization_id = v_quote.organization_id
    AND r.slug = v_approver_role
    AND r.is_active = true;

  -- Insert approval record
  INSERT INTO quote_approvals (
    organization_id, quote_id, requested_by, requested_at,
    current_margin_pct, min_margin_required, justification, status
  )
  VALUES (
    v_quote.organization_id, p_quote_id, v_caller_id, now(),
    v_margin_pct, v_min_margin,
    'Margen ' || v_margin_pct || '% por debajo del minimo ' || v_min_margin || '%',
    'pending'
  );
END;
$$;

COMMENT ON FUNCTION request_margin_approval IS
'Checks quote margin against margin_rules. If below minimum, triggers approval workflow.';

GRANT EXECUTE ON FUNCTION request_margin_approval(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION request_margin_approval(uuid) TO service_role;


-- ============================================================================
-- NEW 4: validate_credit_limit(p_customer_id uuid, p_amount numeric)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_credit_limit(
  p_customer_id uuid,
  p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_customer record;
  v_available_credit numeric(15,2);
  v_caller_id uuid;
  v_caller_org uuid;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT organization_id INTO v_caller_org
  FROM profiles WHERE id = v_caller_id;

  SELECT id, organization_id, credit_limit, outstanding_balance, credit_status, is_blocked
  INTO v_customer
  FROM customers
  WHERE id = p_customer_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_caller_org IS NOT NULL AND v_customer.organization_id != v_caller_org THEN
    RAISE EXCEPTION 'Customer does not belong to your organization'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_customer.is_blocked THEN
    RETURN false;
  END IF;

  IF v_customer.credit_status NOT IN ('approved') THEN
    RETURN false;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive, got: %', p_amount
      USING ERRCODE = 'check_violation';
  END IF;

  v_available_credit := v_customer.credit_limit - v_customer.outstanding_balance;
  RETURN v_available_credit >= p_amount;
END;
$$;

COMMENT ON FUNCTION validate_credit_limit IS
'Validates if a customer has sufficient credit for a given amount.';

GRANT EXECUTE ON FUNCTION validate_credit_limit(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_credit_limit(uuid, numeric) TO service_role;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
