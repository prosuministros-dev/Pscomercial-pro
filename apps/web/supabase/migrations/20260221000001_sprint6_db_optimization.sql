-- ============================================================================
-- Migration: 20260221000001_sprint6_db_optimization.sql
-- Sprint:    6 - TAREA 6.1 Database Optimization
-- Author:    Pscomercial-pro Team
-- Date:      2026-02-21
-- Description:
--   1. Verify/create missing composite indexes for high-traffic queries
--   2. Create materialized views for dashboard performance
--   3. Create refresh function for materialized views
--   4. Create audit_logs partition helper function (non-destructive)
--   5. ANALYZE most-queried tables
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY / CREATE MISSING INDEXES
-- Using IF NOT EXISTS for idempotency. NOT CONCURRENTLY because this runs
-- inside a migration transaction.
-- ============================================================================

-- Orders: composite indexes for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_orders_org_status
  ON orders(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_org_created
  ON orders(organization_id, created_at DESC);

-- Quotes: advisor lookup within organization
CREATE INDEX IF NOT EXISTS idx_quotes_org_advisor
  ON quotes(organization_id, advisor_id);

-- Invoices: status and chronological lookups
CREATE INDEX IF NOT EXISTS idx_invoices_org_status
  ON invoices(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_org_created
  ON invoices(organization_id, created_at DESC);

-- Shipments: status within organization
CREATE INDEX IF NOT EXISTS idx_shipments_org_status
  ON shipments(organization_id, status);

-- Purchase Orders: status within organization
CREATE INDEX IF NOT EXISTS idx_po_org_status
  ON purchase_orders(organization_id, status);

-- WhatsApp Conversations: recent conversations per org
CREATE INDEX IF NOT EXISTS idx_wa_conv_org
  ON whatsapp_conversations(organization_id, updated_at DESC);

-- WhatsApp Messages: messages within a conversation (chronological)
CREATE INDEX IF NOT EXISTS idx_wa_msg_conv
  ON whatsapp_messages(conversation_id, created_at DESC);

-- Email Logs: chronological per organization
CREATE INDEX IF NOT EXISTS idx_email_logs_org
  ON email_logs(organization_id, created_at DESC);

-- Comments: entity-scoped with chronological ordering
CREATE INDEX IF NOT EXISTS idx_comments_entity
  ON comments(entity_type, entity_id, created_at DESC);

-- Audit Logs: chronological per organization
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
  ON audit_logs(organization_id, created_at DESC);

-- Audit Logs: entity lookup
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id);


-- ============================================================================
-- SECTION 2: MATERIALIZED VIEWS
-- Each view includes a UNIQUE index to enable REFRESH ... CONCURRENTLY.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 2a) mv_commercial_dashboard
-- Pipeline summary per advisor: quote counts, value, and margin by status.
-- --------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS mv_commercial_dashboard;

CREATE MATERIALIZED VIEW mv_commercial_dashboard AS
SELECT
  q.organization_id,
  q.advisor_id,
  p.full_name                          AS advisor_name,
  q.status,
  COUNT(*)::int                        AS quote_count,
  COALESCE(SUM(q.total), 0)           AS total_value,
  COALESCE(AVG(q.margin_pct), 0)      AS avg_margin
FROM quotes q
  JOIN profiles p ON p.id = q.advisor_id
WHERE q.deleted_at IS NULL
GROUP BY q.organization_id, q.advisor_id, p.full_name, q.status
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_commercial_dashboard_pk
  ON mv_commercial_dashboard(organization_id, advisor_id, status);

-- --------------------------------------------------------------------------
-- 2b) mv_operational_dashboard
-- Orders summary by organization and status, with average days in status.
-- --------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS mv_operational_dashboard;

CREATE MATERIALIZED VIEW mv_operational_dashboard AS
SELECT
  o.organization_id,
  o.status,
  COUNT(*)::int                        AS order_count,
  COALESCE(SUM(o.total), 0)           AS total_value,
  COALESCE(
    AVG(EXTRACT(EPOCH FROM (now() - o.updated_at)) / 86400),
    0
  )                                    AS avg_days_in_status
FROM orders o
WHERE o.deleted_at IS NULL
GROUP BY o.organization_id, o.status
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_operational_dashboard_pk
  ON mv_operational_dashboard(organization_id, status);

-- --------------------------------------------------------------------------
-- 2c) mv_monthly_kpis
-- Monthly KPIs: leads, quotes, orders, invoiced total, conversion rate.
-- Uses sub-selects to aggregate independently from each source table,
-- then joins on (organization_id, month).
-- --------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_kpis;

CREATE MATERIALIZED VIEW mv_monthly_kpis AS
WITH months AS (
  -- Union of all distinct (org, month) combinations across key tables
  SELECT organization_id, date_trunc('month', created_at) AS month FROM leads  WHERE deleted_at IS NULL
  UNION
  SELECT organization_id, date_trunc('month', created_at) AS month FROM quotes WHERE deleted_at IS NULL
  UNION
  SELECT organization_id, date_trunc('month', created_at) AS month FROM orders WHERE deleted_at IS NULL
  UNION
  SELECT organization_id, date_trunc('month', created_at) AS month FROM invoices
),
lead_counts AS (
  SELECT
    organization_id,
    date_trunc('month', created_at) AS month,
    COUNT(*)::int AS new_leads_count
  FROM leads
  WHERE deleted_at IS NULL
  GROUP BY organization_id, date_trunc('month', created_at)
),
quote_counts AS (
  SELECT
    organization_id,
    date_trunc('month', created_at) AS month,
    COUNT(*)::int AS new_quotes_count
  FROM quotes
  WHERE deleted_at IS NULL
  GROUP BY organization_id, date_trunc('month', created_at)
),
order_counts AS (
  SELECT
    organization_id,
    date_trunc('month', created_at) AS month,
    COUNT(*)::int AS new_orders_count
  FROM orders
  WHERE deleted_at IS NULL
  GROUP BY organization_id, date_trunc('month', created_at)
),
invoice_totals AS (
  SELECT
    organization_id,
    date_trunc('month', created_at) AS month,
    COALESCE(SUM(total), 0) AS invoiced_total
  FROM invoices
  GROUP BY organization_id, date_trunc('month', created_at)
)
SELECT
  m.organization_id,
  m.month,
  COALESCE(l.new_leads_count, 0)   AS new_leads_count,
  COALESCE(q.new_quotes_count, 0)  AS new_quotes_count,
  COALESCE(o.new_orders_count, 0)  AS new_orders_count,
  COALESCE(i.invoiced_total, 0)    AS invoiced_total,
  CASE
    WHEN COALESCE(q.new_quotes_count, 0) > 0
      THEN ROUND(
        (COALESCE(o.new_orders_count, 0)::numeric / q.new_quotes_count) * 100,
        2
      )
    ELSE 0
  END                              AS conversion_rate
FROM months m
  LEFT JOIN lead_counts    l ON l.organization_id = m.organization_id AND l.month = m.month
  LEFT JOIN quote_counts   q ON q.organization_id = m.organization_id AND q.month = m.month
  LEFT JOIN order_counts   o ON o.organization_id = m.organization_id AND o.month = m.month
  LEFT JOIN invoice_totals i ON i.organization_id = m.organization_id AND i.month = m.month
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_kpis_pk
  ON mv_monthly_kpis(organization_id, month);


-- ============================================================================
-- SECTION 3: REFRESH FUNCTION
-- Refreshes all three materialized views concurrently.
-- Must be called after initial data load (first call without CONCURRENTLY
-- is handled by populating WITH DATA or an initial non-concurrent refresh).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First refresh: populate if empty (WITH NO DATA -> first refresh must not be CONCURRENTLY)
  -- We attempt CONCURRENTLY first; if it fails because the view has never been populated,
  -- we fall back to a regular refresh.
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_commercial_dashboard;
  EXCEPTION
    WHEN feature_not_supported THEN
      REFRESH MATERIALIZED VIEW mv_commercial_dashboard;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_operational_dashboard;
  EXCEPTION
    WHEN feature_not_supported THEN
      REFRESH MATERIALIZED VIEW mv_operational_dashboard;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_kpis;
  EXCEPTION
    WHEN feature_not_supported THEN
      REFRESH MATERIALIZED VIEW mv_monthly_kpis;
  END;
END;
$$;

-- Grant execute to application roles
GRANT EXECUTE ON FUNCTION public.refresh_materialized_views() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_materialized_views() TO service_role;

COMMENT ON FUNCTION public.refresh_materialized_views() IS
  'Refreshes all dashboard materialized views concurrently. '
  'Falls back to non-concurrent refresh on first invocation (empty views).';


-- ============================================================================
-- SECTION 4: AUDIT_LOGS PARTITIONING SETUP (function only)
--
-- NOTE: This section only creates a helper function to generate monthly
-- range partitions for audit_logs. It does NOT alter the existing
-- audit_logs table. Converting an existing table to a partitioned table
-- requires recreating it, which should be done during a planned maintenance
-- window or when setting up a fresh database.
--
-- To enable partitioning on a fresh database:
--   1. Create audit_logs with PARTITION BY RANGE (created_at)
--   2. Call create_audit_log_partition() for each needed month
--   3. Set up a cron job (e.g., pg_cron) to call it monthly
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_audit_log_partition(target_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partition_name text;
  start_date     date;
  end_date       date;
BEGIN
  -- Calculate the first and last+1 day of the target month
  start_date     := date_trunc('month', target_date)::date;
  end_date       := (date_trunc('month', target_date) + interval '1 month')::date;
  partition_name := 'audit_logs_' || to_char(target_date, 'YYYYMM');

  -- Create the partition if it does not already exist
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );

  RAISE NOTICE 'Partition % ensured for range [%, %)',
    partition_name, start_date, end_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_audit_log_partition(date) TO service_role;

COMMENT ON FUNCTION public.create_audit_log_partition(date) IS
  'Creates a monthly range partition for audit_logs (e.g., audit_logs_202602). '
  'Only useful after audit_logs has been converted to a partitioned table. '
  'Call with the target month date, e.g.: SELECT create_audit_log_partition(''2026-03-01'');';


-- ============================================================================
-- SECTION 5: ANALYZE
-- Update table statistics for the query planner on the most queried tables.
-- ============================================================================

ANALYZE leads;
ANALYZE quotes;
ANALYZE orders;
ANALYZE invoices;
ANALYZE notifications;
ANALYZE audit_logs;


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
