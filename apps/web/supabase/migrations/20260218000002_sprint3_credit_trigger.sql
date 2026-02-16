-- Sprint 3: Credit update trigger + license renewal column
-- When an invoice is marked as 'paid', update customer credit

-- 1) Add previous_license_id for renewal tracking
ALTER TABLE license_records
  ADD COLUMN IF NOT EXISTS previous_license_id uuid REFERENCES license_records(id);

-- 2) Function to update customer credit when invoice is paid
CREATE OR REPLACE FUNCTION update_customer_credit_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_customer_id uuid;
  v_total numeric;
BEGIN
  -- Only act when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    v_order_id := NEW.order_id;
    v_total := NEW.total;

    -- Get customer_id from the order
    SELECT customer_id INTO v_customer_id
    FROM orders
    WHERE id = v_order_id;

    IF v_customer_id IS NOT NULL THEN
      -- Decrease outstanding_balance, increase credit_available
      UPDATE customers
      SET
        outstanding_balance = GREATEST(outstanding_balance - v_total, 0),
        credit_available = LEAST(credit_limit, credit_available + v_total)
      WHERE id = v_customer_id;
    END IF;
  END IF;

  -- When a new invoice is created (pending), increase outstanding balance
  IF TG_OP = 'INSERT' AND NEW.status IN ('pending', 'sent') THEN
    SELECT customer_id INTO v_customer_id
    FROM orders
    WHERE id = NEW.order_id;

    IF v_customer_id IS NOT NULL THEN
      UPDATE customers
      SET
        outstanding_balance = outstanding_balance + NEW.total,
        credit_available = GREATEST(credit_available - NEW.total, 0)
      WHERE id = v_customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Create trigger on invoices table
DROP TRIGGER IF EXISTS trg_update_credit_on_invoice ON invoices;
CREATE TRIGGER trg_update_credit_on_invoice
  AFTER INSERT OR UPDATE OF status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_credit_on_payment();

-- 4) Grant execute
GRANT EXECUTE ON FUNCTION update_customer_credit_on_payment() TO authenticated;
