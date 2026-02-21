
-- Add credit_used column to customers (= credit_limit - credit_available)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS credit_used numeric(15,2) NOT NULL DEFAULT 0;

-- Set initial values based on existing data
UPDATE public.customers
SET credit_used = GREATEST(credit_limit - credit_available, 0)
WHERE credit_used = 0 AND credit_limit > 0;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
