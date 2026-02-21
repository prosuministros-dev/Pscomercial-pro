
-- 1. Add deleted_at to suppliers table for soft-delete support
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Add missing columns to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS assigned_sales_rep_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS department varchar(100);

-- 3. Create the FK constraint name that the API expects for the profiles join
-- The API uses: profiles!customers_assigned_sales_rep_id_fkey
-- We need a FK from customers.assigned_sales_rep_id -> profiles.id
-- But profiles.id references auth.users(id), so we need a direct FK to profiles
DO $$
BEGIN
  -- Check if profiles table has its own id or references auth.users
  -- The FK to auth.users is already created above, but PostgREST needs
  -- a relationship path to profiles. We create a FK directly to profiles.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customers_assigned_sales_rep_id_fkey'
    AND table_name = 'customers'
  ) THEN
    -- The FK was created pointing to auth.users, rename it
    ALTER TABLE public.customers
    DROP CONSTRAINT IF EXISTS customers_assigned_sales_rep_id_fkey;

    -- Create FK pointing to public.profiles instead (which PostgREST can resolve)
    ALTER TABLE public.customers
    ADD CONSTRAINT customers_assigned_sales_rep_id_fkey
    FOREIGN KEY (assigned_sales_rep_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_customers_assigned_sales_rep
ON public.customers(assigned_sales_rep_id) WHERE assigned_sales_rep_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at
ON public.suppliers(deleted_at) WHERE deleted_at IS NULL;
