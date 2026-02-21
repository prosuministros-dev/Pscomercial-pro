-- ============================================================================
-- Migration: 20260222000004_quotes_add_missing_columns.sql
-- Date: 2026-02-22
-- Description: Add missing columns to quotes table that existed in TypeScript
--              types and API routes but were not present in the database schema.
-- ============================================================================

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS credit_blocked          boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS credit_blocked_by       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS credit_blocked_at       timestamptz,
  ADD COLUMN IF NOT EXISTS credit_block_reason     text,
  ADD COLUMN IF NOT EXISTS estimated_close_month   varchar(7),   -- e.g. '2026-03'
  ADD COLUMN IF NOT EXISTS estimated_close_week    varchar(8),   -- e.g. '2026-W12'
  ADD COLUMN IF NOT EXISTS estimated_billing_date  date,
  ADD COLUMN IF NOT EXISTS rejection_reason        text;

-- Indexes for common filter queries
CREATE INDEX IF NOT EXISTS idx_quotes_credit_blocked ON quotes(credit_blocked) WHERE credit_blocked = true;
CREATE INDEX IF NOT EXISTS idx_quotes_close_month    ON quotes(estimated_close_month) WHERE estimated_close_month IS NOT NULL;
