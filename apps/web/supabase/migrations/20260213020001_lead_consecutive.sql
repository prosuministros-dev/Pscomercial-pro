-- ============================================================================
-- PSCOMERCIAL-PRO - LEAD CONSECUTIVE NUMBER GENERATOR
-- Migration: 20260213020001_lead_consecutive.sql
-- Date: 2026-02-13
-- Description: Thread-safe consecutive number generator for leads, quotes, orders
-- HU: HU-0001 (Registro de Leads)
-- Task: TAREA 1.3.2
-- ============================================================================

-- Function: generate_consecutive
-- Generates next consecutive number for entities (lead #100+, quote #30000+, order #20000+)
-- Thread-safe: Uses SELECT FOR UPDATE to prevent race conditions
CREATE OR REPLACE FUNCTION generate_consecutive(
  org_uuid uuid,
  entity_type varchar
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number integer;
  start_number integer;
BEGIN
  -- Define starting number based on entity type
  start_number := CASE entity_type
    WHEN 'lead' THEN 100
    WHEN 'quote' THEN 30000
    WHEN 'order' THEN 20000
    ELSE 1
  END;

  -- Thread-safe: Use advisory lock to prevent race conditions
  -- pg_advisory_xact_lock is released automatically at end of transaction
  PERFORM pg_advisory_xact_lock(hashtext(org_uuid::text || entity_type));

  IF entity_type = 'lead' THEN
    SELECT COALESCE(MAX(lead_number), start_number - 1) + 1
    INTO next_number
    FROM leads
    WHERE organization_id = org_uuid;

  ELSIF entity_type = 'quote' THEN
    SELECT COALESCE(MAX(quote_number), start_number - 1) + 1
    INTO next_number
    FROM quotes
    WHERE organization_id = org_uuid;

  ELSIF entity_type = 'order' THEN
    SELECT COALESCE(MAX(order_number), start_number - 1) + 1
    INTO next_number
    FROM orders
    WHERE organization_id = org_uuid;
  ELSE
    RAISE EXCEPTION 'Invalid entity_type: %. Must be lead, quote, or order', entity_type;
  END IF;

  RETURN next_number;
END;
$$;

COMMENT ON FUNCTION generate_consecutive IS 'Thread-safe consecutive number generator for leads (#100+), quotes (#30000+), and orders (#20000+). Uses SELECT FOR UPDATE to prevent race conditions.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_consecutive TO authenticated;
