-- ============================================================================
-- PSCOMERCIAL-PRO - LEAD AUTO-ASSIGNMENT & REASSIGNMENT
-- Migration: 20260213020002_auto_assign_lead.sql
-- Date: 2026-02-13
-- Description: Auto-assignment logic for leads with load balancing and deactivation handling
-- HU: HU-0002 (Asignación de Leads)
-- Task: TAREA 1.3.7, 1.3.9
-- ============================================================================

-- Function: auto_assign_lead
-- Automatically assigns a lead to the advisor with the fewest pending leads
-- Business rules:
-- - Only active and available advisors
-- - Roles: comercial, gerente_comercial
-- - Maximum 5 pending leads per advisor
-- - Load balancing: assign to advisor with least pending leads
-- - Random tiebreaker for equal loads
CREATE OR REPLACE FUNCTION auto_assign_lead(
  lead_uuid uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_uuid uuid;
  assigned_user_id uuid;
  pending_count integer;
BEGIN
  -- Get organization from lead
  SELECT organization_id INTO org_uuid
  FROM leads
  WHERE id = lead_uuid;

  IF org_uuid IS NULL THEN
    RAISE EXCEPTION 'Lead not found: %', lead_uuid;
  END IF;

  -- Find advisor with least pending leads (max 5)
  -- Priority order:
  -- 1. Active and available advisors only
  -- 2. Roles: comercial or gerente_comercial
  -- 3. Less than 5 pending leads
  -- 4. Sort by least pending leads first
  -- 5. Random tiebreaker
  SELECT p.id INTO assigned_user_id
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.id
  INNER JOIN roles r ON r.id = ur.role_id
  WHERE p.organization_id = org_uuid
    AND p.is_active = true
    AND p.is_available = true
    AND r.slug IN ('comercial', 'gerente_comercial')
    AND (
      SELECT COUNT(*)
      FROM leads l
      WHERE l.assigned_to = p.id
        AND l.status IN ('pending_assignment', 'assigned', 'pending_info')
        AND l.organization_id = org_uuid
        AND l.deleted_at IS NULL
    ) < 5
  ORDER BY (
    SELECT COUNT(*)
    FROM leads l
    WHERE l.assigned_to = p.id
      AND l.status IN ('pending_assignment', 'assigned', 'pending_info')
      AND l.deleted_at IS NULL
  ) ASC, RANDOM()
  LIMIT 1;

  -- Update lead if advisor found
  IF assigned_user_id IS NOT NULL THEN
    UPDATE leads
    SET
      assigned_to = assigned_user_id,
      assigned_at = now(),
      status = 'assigned'
    WHERE id = lead_uuid;

    -- Log assignment to audit trail
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
      org_uuid,
      lead_uuid,
      NULL, -- No previous assignment
      assigned_user_id,
      'automatic',
      'Auto-assigned by system based on load balancing',
      assigned_user_id -- System assignment
    ;

    -- Create notification for assigned advisor
    INSERT INTO notifications (
      organization_id,
      user_id,
      type,
      title,
      message,
      action_url,
      entity_type,
      entity_id,
      priority
    )
    SELECT
      org_uuid,
      assigned_user_id,
      'lead_assigned',
      'Nuevo lead asignado',
      'Se te ha asignado el lead #' || (SELECT lead_number FROM leads WHERE id = lead_uuid),
      '/leads/' || lead_uuid,
      'lead',
      lead_uuid,
      'normal'
    ;
  ELSE
    -- No available advisor found, set status to pending_assignment
    UPDATE leads
    SET status = 'pending_assignment'
    WHERE id = lead_uuid;
  END IF;

  RETURN assigned_user_id;
END;
$$;

COMMENT ON FUNCTION auto_assign_lead IS 'Auto-assign lead to advisor with fewest pending leads (max 5). Creates notification and logs assignment.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_assign_lead TO authenticated;

-- ============================================================================
-- TRIGGER: Reassign leads when advisor is deactivated
-- ============================================================================

-- Function: reassign_leads_on_deactivation
-- When an advisor is deactivated (is_active = false), reassign all their pending leads
-- The leads will be set to 'created' status and can be re-assigned in the next cycle
CREATE OR REPLACE FUNCTION reassign_leads_on_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
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
      NULL, -- Unassigned
      'reassignment',
      'Advisor deactivated - lead unassigned for auto-reassignment',
      NEW.id
    FROM leads l
    WHERE l.assigned_to IS NULL
      AND l.status = 'created'
      AND l.organization_id = NEW.organization_id
      AND l.updated_at >= now() - INTERVAL '1 second' -- Just updated
      AND l.deleted_at IS NULL;

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION reassign_leads_on_deactivation IS 'Unassigns all pending leads when an advisor is deactivated';

-- Create trigger on profiles table
CREATE TRIGGER trigger_reassign_on_deactivation
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION reassign_leads_on_deactivation();

COMMENT ON TRIGGER trigger_reassign_on_deactivation ON profiles IS 'Reassign leads when advisor is deactivated';

-- ============================================================================
-- ADDITIONAL HELPER FUNCTION: Manual reassignment
-- ============================================================================

-- Function: reassign_lead
-- Manually reassign a lead to a different advisor
-- Validates that the target advisor has capacity
CREATE OR REPLACE FUNCTION reassign_lead(
  lead_uuid uuid,
  new_advisor_id uuid,
  performed_by_id uuid,
  reassignment_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_uuid uuid;
  old_advisor_id uuid;
  pending_count integer;
  advisor_active boolean;
BEGIN
  -- Get lead details
  SELECT organization_id, assigned_to INTO org_uuid, old_advisor_id
  FROM leads
  WHERE id = lead_uuid;

  IF org_uuid IS NULL THEN
    RAISE EXCEPTION 'Lead not found: %', lead_uuid;
  END IF;

  -- Verify new advisor is active and has capacity
  SELECT is_active INTO advisor_active
  FROM profiles
  WHERE id = new_advisor_id
    AND organization_id = org_uuid;

  IF advisor_active IS NULL THEN
    RAISE EXCEPTION 'Advisor not found or not in same organization: %', new_advisor_id;
  END IF;

  IF advisor_active = false THEN
    RAISE EXCEPTION 'Cannot assign to inactive advisor: %', new_advisor_id;
  END IF;

  -- Check pending lead count
  SELECT COUNT(*) INTO pending_count
  FROM leads
  WHERE assigned_to = new_advisor_id
    AND status IN ('pending_assignment', 'assigned', 'pending_info')
    AND organization_id = org_uuid
    AND deleted_at IS NULL;

  IF pending_count >= 5 THEN
    RAISE EXCEPTION 'Advisor has reached maximum pending leads (5): %', new_advisor_id;
  END IF;

  -- Update lead assignment
  UPDATE leads
  SET
    assigned_to = new_advisor_id,
    assigned_at = now(),
    assigned_by = performed_by_id,
    status = 'assigned',
    updated_at = now()
  WHERE id = lead_uuid;

  -- Log reassignment
  INSERT INTO lead_assignments_log (
    organization_id,
    lead_id,
    from_user_id,
    to_user_id,
    assignment_type,
    reason,
    performed_by
  )
  VALUES (
    org_uuid,
    lead_uuid,
    old_advisor_id,
    new_advisor_id,
    'manual',
    reassignment_reason,
    performed_by_id
  );

  -- Create notification for new advisor
  INSERT INTO notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    action_url,
    entity_type,
    entity_id,
    priority
  )
  SELECT
    org_uuid,
    new_advisor_id,
    'lead_assigned',
    'Lead reasignado',
    'Se te ha reasignado el lead #' || (SELECT lead_number FROM leads WHERE id = lead_uuid),
    '/leads/' || lead_uuid,
    'lead',
    lead_uuid,
    'normal'
  ;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION reassign_lead IS 'Manually reassign a lead to a different advisor with capacity validation';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reassign_lead TO authenticated;
