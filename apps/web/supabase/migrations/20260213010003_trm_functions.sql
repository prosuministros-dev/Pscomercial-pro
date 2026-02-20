-- Migration: TRM Functions
-- Date: 2026-02-13
-- Description: RPC functions for TRM (exchange rate) management
-- Function: get_current_trm() - Returns current USD to COP exchange rate

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_current_trm(uuid);

-- RPC: get_current_trm(org_uuid)
-- Returns the most recent TRM rate for the organization
-- STABLE function for query caching (safe for query optimization)
-- Returns fallback rate (4000.00 COP) if no data available
CREATE OR REPLACE FUNCTION get_current_trm(org_uuid uuid)
RETURNS numeric(10,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  current_rate numeric(10,2);
BEGIN
  -- Get the most recent TRM rate for the organization
  -- Using rate_date <= CURRENT_DATE to avoid future rates
  SELECT rate_value INTO current_rate
  FROM trm_rates
  WHERE organization_id = org_uuid
  AND rate_date <= CURRENT_DATE
  ORDER BY rate_date DESC, created_at DESC
  LIMIT 1;

  -- Fallback: return default rate if no data available
  -- Default rate: 4000.00 COP per USD (approximate long-term average)
  IF current_rate IS NULL THEN
    RETURN 4000.00;
  END IF;

  RETURN current_rate;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION get_current_trm IS 'Get current USD to COP exchange rate for an organization with fallback to 4000.00 COP';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_trm(uuid) TO authenticated;

-- Optional: Helper function to get latest TRM rate date
CREATE OR REPLACE FUNCTION get_current_trm_date(org_uuid uuid)
RETURNS date
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  latest_date date;
BEGIN
  SELECT rate_date INTO latest_date
  FROM trm_rates
  WHERE organization_id = org_uuid
  AND rate_date <= CURRENT_DATE
  ORDER BY rate_date DESC, created_at DESC
  LIMIT 1;

  RETURN latest_date;
END;
$$;

COMMENT ON FUNCTION get_current_trm_date IS 'Get the date of the most recent TRM rate for an organization';
GRANT EXECUTE ON FUNCTION get_current_trm_date(uuid) TO authenticated;

-- Optional: Helper function to insert or update TRM rate
CREATE OR REPLACE FUNCTION upsert_trm_rate(
  org_uuid uuid,
  p_rate_date date,
  p_rate_value numeric(10,2),
  p_source varchar(50) DEFAULT 'manual',
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rate_id uuid;
BEGIN
  -- Validate rate value
  IF p_rate_value <= 0 THEN
    RAISE EXCEPTION 'Rate value must be positive';
  END IF;

  -- Validate source
  IF p_source NOT IN ('manual', 'api_banrep', 'api_superfinanciera') THEN
    RAISE EXCEPTION 'Invalid source. Must be: manual, api_banrep, or api_superfinanciera';
  END IF;

  -- Insert or update TRM rate
  INSERT INTO trm_rates (
    organization_id,
    rate_date,
    rate_value,
    source,
    created_by,
    created_at
  ) VALUES (
    org_uuid,
    p_rate_date,
    p_rate_value,
    p_source,
    p_user_id,
    now()
  )
  ON CONFLICT (organization_id, rate_date)
  DO UPDATE SET
    rate_value = EXCLUDED.rate_value,
    source = EXCLUDED.source,
    created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at
  RETURNING id INTO rate_id;

  RETURN rate_id;
END;
$$;

COMMENT ON FUNCTION upsert_trm_rate IS 'Insert or update TRM rate for a specific date';
GRANT EXECUTE ON FUNCTION upsert_trm_rate(uuid, date, numeric, varchar, uuid) TO authenticated;

-- Test the function (optional verification)
DO $$
DECLARE
  test_org_id uuid;
  test_rate numeric(10,2);
BEGIN
  -- Get first organization for testing
  SELECT id INTO test_org_id FROM organizations LIMIT 1;

  IF test_org_id IS NOT NULL THEN
    -- Test get_current_trm function
    test_rate := get_current_trm(test_org_id);
    RAISE NOTICE 'Test get_current_trm for org %: % COP', test_org_id, test_rate;

    IF test_rate = 4000.00 THEN
      RAISE NOTICE 'Fallback rate returned (no TRM data exists yet)';
    ELSE
      RAISE NOTICE 'TRM rate found in database';
    END IF;
  ELSE
    RAISE NOTICE 'No organizations found for testing';
  END IF;
END $$;
