-- ============================================================================
-- PSCOMERCIAL-PRO - SPRINT 2B: Schema Changes
-- Migration: 20260217000001_sprint2b_schema.sql
-- Date: 2026-02-17
-- Description:
--   1. Add billing_type + advance billing columns to orders
--   2. Create order_destinations table (multiple delivery destinations)
--   3. Expand notification types
--   4. Add client_response to quotes
--   5. New permissions + role grants
--   6. get_users_by_role RPC
-- ============================================================================


-- ============================================================================
-- 1. Add billing_type column to orders
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_type varchar(30) DEFAULT 'total';
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT chk_billing_type
    CHECK (billing_type IN ('total', 'parcial'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- 2. Advance billing 4-step columns on orders
-- ============================================================================

-- Step 1: Solicitud de facturación anticipada
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_request varchar(20) DEFAULT 'not_required';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_request_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_request_by uuid REFERENCES auth.users(id);

-- Step 2: Aprobación de facturación anticipada
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_approval varchar(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_approval_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_approval_by uuid REFERENCES auth.users(id);

-- Step 3: Generación de remisión anticipada
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_remission varchar(20) DEFAULT 'not_generated';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_remission_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_remission_by uuid REFERENCES auth.users(id);

-- Step 4: Generación de factura anticipada
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_invoice varchar(20) DEFAULT 'not_generated';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_invoice_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_billing_invoice_by uuid REFERENCES auth.users(id);

-- CHECK constraints for step values (safe with DO block)
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT chk_adv_billing_request
    CHECK (adv_billing_request IN ('not_required', 'required'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT chk_adv_billing_approval
    CHECK (adv_billing_approval IN ('pending', 'approved'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT chk_adv_billing_remission
    CHECK (adv_billing_remission IN ('not_generated', 'generated'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT chk_adv_billing_invoice
    CHECK (adv_billing_invoice IN ('not_generated', 'generated'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- 3. Payment confirmation tracking
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by uuid REFERENCES auth.users(id);


-- ============================================================================
-- 4. order_destinations table (multiple delivery destinations per order)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 1,
  delivery_address text NOT NULL,
  delivery_city varchar(100),
  delivery_contact varchar(255),
  delivery_phone varchar(20),
  delivery_schedule varchar(100),
  dispatch_type varchar(30),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_dest_dispatch_type
    CHECK (dispatch_type IS NULL OR dispatch_type IN ('envio', 'retiro', 'mensajeria'))
);

CREATE INDEX IF NOT EXISTS idx_order_destinations_order ON order_destinations(order_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_order_destinations_org ON order_destinations(organization_id);

COMMENT ON TABLE order_destinations IS 'Multiple delivery destinations per order. Each destination validates independently.';

-- RLS for order_destinations
ALTER TABLE order_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_destinations_select" ON order_destinations
  FOR SELECT TO authenticated
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "order_destinations_insert" ON order_destinations
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "order_destinations_update" ON order_destinations
  FOR UPDATE TO authenticated
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "order_destinations_delete" ON order_destinations
  FOR DELETE TO authenticated
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

GRANT ALL ON order_destinations TO authenticated;
GRANT ALL ON order_destinations TO service_role;

-- Trigger for updated_at
CREATE TRIGGER trg_order_destinations_updated_at
  BEFORE UPDATE ON order_destinations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 5. Expand notification type constraint
-- ============================================================================
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notification_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notification_type
  CHECK (type IN (
    'lead_assigned', 'quote_approval', 'order_created', 'mention', 'alert', 'system',
    'margin_approved', 'margin_rejected',
    'payment_confirmed', 'billing_step_change',
    'quote_sent', 'quote_reminder'
  ));


-- ============================================================================
-- 6. Add client_response to quotes
-- ============================================================================
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_response varchar(30);
DO $$ BEGIN
  ALTER TABLE quotes ADD CONSTRAINT chk_client_response
    CHECK (client_response IS NULL OR client_response IN ('accepted', 'changes_requested', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- 7. New permissions for payment confirmation and billing workflow
-- ============================================================================
INSERT INTO permissions (module, action, slug, description) VALUES
  ('orders', 'confirm_payment', 'orders:confirm_payment', 'Confirmar pago de pedido (solo forma de pago Anticipado)'),
  ('orders', 'manage_billing', 'orders:manage_billing', 'Gestionar pasos de facturación anticipada')
ON CONFLICT (slug) DO NOTHING;

-- Grant orders:confirm_payment to finanzas, facturacion, gerente_general, super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.organization_id = '00000000-0000-0000-0000-000000000001'
  AND r.slug IN ('finanzas', 'facturacion', 'gerente_general', 'super_admin')
  AND p.slug = 'orders:confirm_payment'
ON CONFLICT DO NOTHING;

-- Grant orders:manage_billing to all area roles + managers
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.organization_id = '00000000-0000-0000-0000-000000000001'
  AND r.slug IN ('finanzas', 'facturacion', 'compras', 'logistica', 'asesor_comercial',
                  'gerente_comercial', 'director_comercial', 'gerente_general', 'super_admin')
  AND p.slug = 'orders:manage_billing'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 8. get_users_by_role RPC
-- Look up all active users with a specific role slug in an organization
-- Used for sending notifications to area teams
-- ============================================================================
CREATE OR REPLACE FUNCTION get_users_by_role(
  p_organization_id uuid,
  p_role_slug text
)
RETURNS TABLE(user_id uuid, email text, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.email::text,
    COALESCE(p.display_name, p.email)::text AS display_name
  FROM user_roles ur
  INNER JOIN roles r ON r.id = ur.role_id AND r.is_active = true
  INNER JOIN profiles p ON p.id = ur.user_id
  WHERE r.slug = p_role_slug
    AND r.organization_id = p_organization_id
  ORDER BY p.display_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_by_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_role(uuid, text) TO service_role;

COMMENT ON FUNCTION get_users_by_role IS
'Returns all active users with a specific role slug in an organization. Used for sending notifications to area teams.';


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
