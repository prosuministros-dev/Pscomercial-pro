-- ============================================================================
-- PSCOMERCIAL-PRO - SPRINT 2B: Function Updates
-- Migration: 20260217000002_sprint2b_functions.sql
-- Date: 2026-02-17
-- Description:
--   1. Update create_order_from_quote to handle Anticipado payment + billing_type
-- ============================================================================


-- ============================================================================
-- 1. Updated create_order_from_quote
-- Drop old 1-param overload first, then create new 2-param version
-- Now checks customer payment_terms for Anticipado and sets:
--   - requires_advance_billing = true
--   - initial status = 'payment_pending' (instead of 'created')
-- Also accepts optional billing_type parameter
-- ============================================================================

DROP FUNCTION IF EXISTS create_order_from_quote(uuid);

CREATE OR REPLACE FUNCTION create_order_from_quote(
  p_quote_id uuid,
  p_billing_type text DEFAULT 'total'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_org uuid;
  v_quote record;
  v_customer record;
  v_order_id uuid;
  v_order_number integer;
  v_existing_order uuid;
  v_initial_status text;
  v_requires_advance boolean;
BEGIN
  -- Authenticate caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Get caller organization
  SELECT organization_id INTO v_caller_org
  FROM profiles
  WHERE id = v_caller_id;

  IF v_caller_org IS NULL THEN
    RAISE EXCEPTION 'User profile not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Get quote details
  SELECT * INTO v_quote
  FROM quotes
  WHERE id = p_quote_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found: %', p_quote_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Verify quote belongs to caller's organization
  IF v_quote.organization_id != v_caller_org THEN
    RAISE EXCEPTION 'Quote does not belong to your organization'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Verify quote status allows order creation
  IF v_quote.status NOT IN ('approved', 'pending_oc', 'offer_created', 'negotiation') THEN
    RAISE EXCEPTION 'Quote status "%" does not allow order creation. Must be approved or pending_oc.', v_quote.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Check if an order already exists for this quote
  SELECT id INTO v_existing_order
  FROM orders
  WHERE quote_id = p_quote_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'An order already exists for this quote (order_id: %)', v_existing_order
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Verify margin is approved (if margin was below minimum)
  IF v_quote.margin_pct IS NOT NULL AND v_quote.margin_approved = false THEN
    PERFORM 1 FROM quote_approvals
    WHERE quote_id = p_quote_id
      AND status = 'pending';
    IF FOUND THEN
      RAISE EXCEPTION 'Quote has a pending margin approval. Cannot create order until approved.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Determine if payment is Anticipado (check customer payment_terms)
  SELECT * INTO v_customer
  FROM customers
  WHERE id = v_quote.customer_id;

  -- Set initial status and advance billing flag based on payment terms
  IF LOWER(COALESCE(v_quote.payment_terms, '')) LIKE '%anticipado%' THEN
    v_initial_status := 'payment_pending';
    v_requires_advance := true;
  ELSE
    v_initial_status := 'created';
    v_requires_advance := false;
  END IF;

  -- Validate billing_type parameter
  IF p_billing_type NOT IN ('total', 'parcial') THEN
    RAISE EXCEPTION 'Invalid billing_type: %. Must be total or parcial.', p_billing_type
      USING ERRCODE = 'check_violation';
  END IF;

  -- Generate order number
  v_order_number := generate_consecutive(v_quote.organization_id, 'order');

  -- Create the order
  INSERT INTO orders (
    organization_id,
    order_number,
    quote_id,
    customer_id,
    advisor_id,
    status,
    payment_status,
    payment_terms,
    requires_advance_billing,
    billing_type,
    currency,
    subtotal,
    tax_amount,
    total,
    created_by
  )
  VALUES (
    v_quote.organization_id,
    v_order_number,
    p_quote_id,
    v_quote.customer_id,
    v_quote.advisor_id,
    v_initial_status,
    'pending',
    v_quote.payment_terms,
    v_requires_advance,
    p_billing_type,
    v_quote.currency,
    v_quote.subtotal,
    v_quote.tax_amount,
    v_quote.total,
    v_caller_id
  )
  RETURNING id INTO v_order_id;

  -- Copy quote items to order items
  INSERT INTO order_items (
    order_id,
    quote_item_id,
    product_id,
    sku,
    description,
    quantity,
    unit_price,
    subtotal,
    tax_amount,
    total,
    item_status
  )
  SELECT
    v_order_id,
    qi.id,
    qi.product_id,
    qi.sku,
    qi.description,
    qi.quantity,
    qi.unit_price,
    qi.subtotal,
    qi.tax_amount,
    qi.total,
    'pending'
  FROM quote_items qi
  WHERE qi.quote_id = p_quote_id
  ORDER BY qi.sort_order;

  -- Create initial status history record
  INSERT INTO order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    notes
  )
  VALUES (
    v_order_id,
    NULL,
    v_initial_status,
    v_caller_id,
    'Pedido creado desde cotizacion #' || v_quote.quote_number
      || CASE WHEN v_requires_advance THEN ' (pago anticipado - pendiente confirmación)' ELSE '' END
  );

  -- Update quote status to pending_oc
  UPDATE quotes
  SET status = 'pending_oc',
      updated_at = now()
  WHERE id = p_quote_id
    AND status NOT IN ('pending_oc');

  RETURN v_order_id;
END;
$$;

COMMENT ON FUNCTION create_order_from_quote IS
'Creates a new order from an approved quote. Copies all items, generates consecutive order number (#20000+), creates initial status history, marks quote as pending_oc. For Anticipado payment, sets requires_advance_billing=true and initial status=payment_pending.';

GRANT EXECUTE ON FUNCTION create_order_from_quote(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_from_quote(uuid, text) TO service_role;


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
