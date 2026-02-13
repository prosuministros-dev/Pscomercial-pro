-- ============================================================================
-- PSCOMERCIAL-PRO - QUOTE FUNCTIONS AND TRIGGERS
-- Migration: 20260213030001_quote_functions.sql
-- Date: 2026-02-13
-- Description: Quote management functions and automatic total calculation
-- HU: HU-0005 (Cotizaciones)
-- Tasks: TAREA 1.4.2, 1.4.4, 1.4.5
-- ============================================================================

-- Function: create_quote_from_lead
-- Creates a new quote from an existing lead
-- Copies lead information and assigns quote number automatically
CREATE OR REPLACE FUNCTION create_quote_from_lead(
  lead_uuid uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Ensure lead is not already converted
  IF lead_record.status = 'converted' AND lead_record.customer_id IS NOT NULL THEN
    -- Lead already has a customer, check if there's already a quote
    SELECT id INTO new_quote_id
    FROM quotes
    WHERE lead_id = lead_uuid
    LIMIT 1;

    IF FOUND THEN
      RETURN new_quote_id;  -- Return existing quote
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
    lead_record.customer_id,  -- If lead has customer_id, use it; otherwise will need to be set
    lead_record.assigned_to,  -- Advisor from lead
    now(),
    30,  -- Default 30 days validity
    now() + interval '30 days',
    'draft',
    'COP',
    'ANTICIPADO',  -- Default payment term
    0,
    0,
    0,
    lead_record.created_by
  )
  RETURNING id INTO new_quote_id;

  -- Update lead status to converted if not already
  IF lead_record.status != 'converted' THEN
    UPDATE leads
    SET status = 'converted',
        converted_at = now(),
        customer_id = COALESCE(lead_record.customer_id, lead_record.customer_id)
    WHERE id = lead_uuid;
  END IF;

  RETURN new_quote_id;
END;
$$;

COMMENT ON FUNCTION create_quote_from_lead IS 'Creates a new quote from a lead, auto-generates quote number (#30000+), and marks lead as converted.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_quote_from_lead TO authenticated;

-- ============================================================================

-- Function: calculate_quote_totals
-- Recalculates all totals for a quote based on its line items
-- Returns the calculated values as JSONB
CREATE OR REPLACE FUNCTION calculate_quote_totals(
  quote_uuid uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  calc_subtotal numeric(15,2);
  calc_tax_amount numeric(15,2);
  calc_total numeric(15,2);
  calc_transport numeric(15,2);
  calc_total_cost numeric(15,2);
  calc_margin_pct numeric(5,2);
  transport_included_flag boolean;
BEGIN
  -- Get transport info
  SELECT transport_cost, transport_included
  INTO calc_transport, transport_included_flag
  FROM quotes
  WHERE id = quote_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found: %', quote_uuid;
  END IF;

  -- Calculate subtotal (sum of all items before tax)
  SELECT
    COALESCE(SUM(subtotal), 0),
    COALESCE(SUM(tax_amount), 0),
    COALESCE(SUM(cost_price * quantity), 0)
  INTO calc_subtotal, calc_tax_amount, calc_total_cost
  FROM quote_items
  WHERE quote_id = quote_uuid;

  -- Add transport to total cost if not included in items
  IF NOT transport_included_flag THEN
    calc_total_cost := calc_total_cost + COALESCE(calc_transport, 0);
  END IF;

  -- Calculate total (subtotal + tax + transport if not included)
  calc_total := calc_subtotal + calc_tax_amount;
  IF NOT transport_included_flag THEN
    calc_total := calc_total + COALESCE(calc_transport, 0);
  END IF;

  -- Calculate margin percentage
  -- Margin % = 1 - (Total cost / Total venta)
  -- Protect against division by zero
  IF calc_total > 0 THEN
    calc_margin_pct := ROUND(((calc_total - calc_total_cost) / calc_total) * 100, 2);
  ELSE
    calc_margin_pct := 0;
  END IF;

  -- Update the quote
  UPDATE quotes
  SET
    subtotal = calc_subtotal,
    tax_amount = calc_tax_amount,
    total = calc_total,
    margin_pct = calc_margin_pct,
    updated_at = now()
  WHERE id = quote_uuid;

  -- Return calculated values
  result := jsonb_build_object(
    'subtotal', calc_subtotal,
    'tax_amount', calc_tax_amount,
    'total', calc_total,
    'transport_cost', COALESCE(calc_transport, 0),
    'total_cost', calc_total_cost,
    'margin_pct', calc_margin_pct,
    'profit', calc_total - calc_total_cost
  );

  RETURN result;
END;
$$;

COMMENT ON FUNCTION calculate_quote_totals IS 'Recalculates quote totals (subtotal, tax, total, margin) based on quote items. Formula: Margin % = 1 - (Total cost / Total venta).';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_quote_totals TO authenticated;

-- ============================================================================

-- Trigger Function: trigger_update_quote_totals_fn
-- Automatically recalculates quote totals when items change
CREATE OR REPLACE FUNCTION trigger_update_quote_totals_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recalculate totals for the affected quote
  -- Use TG_OP to determine which quote_id to use
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_quote_totals(OLD.quote_id);
  ELSE
    PERFORM calculate_quote_totals(NEW.quote_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger: update_quote_totals
-- Fires on INSERT, UPDATE, DELETE of quote_items
DROP TRIGGER IF EXISTS update_quote_totals ON quote_items;
CREATE TRIGGER update_quote_totals
  AFTER INSERT OR UPDATE OR DELETE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_quote_totals_fn();

COMMENT ON TRIGGER update_quote_totals ON quote_items IS 'Automatically recalculates quote totals when items are added, updated, or deleted.';
