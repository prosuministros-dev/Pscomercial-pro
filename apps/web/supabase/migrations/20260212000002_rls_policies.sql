-- ============================================================================
-- PSCOMERCIAL-PRO - ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 20260212000002_rls_policies.sql
-- Date: 2026-02-12
-- Description: Complete RLS implementation for multi-tenant data isolation
-- Reference: FASE-04-RLS-Supabase.md
-- Base: PostgreSQL 15 (Supabase)
-- ============================================================================

-- ============================================================================
-- PART 1: HELPER FUNCTIONS IN PUBLIC SCHEMA
-- NOTE: Supabase hosted does not allow creating functions in auth schema via CLI.
-- These functions use SECURITY DEFINER to access auth.uid() from public schema.
-- ============================================================================

-- Function: get_user_org_id
-- Extracts organization_id from the current user's profile
-- STABLE: Cached per transaction for performance
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id
  FROM profiles
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_org_id IS 'Returns organization_id for the current authenticated user. STABLE for per-transaction caching.';

-- Function: is_org_admin
-- Check if user has super_admin, gerente_general, director_comercial, or gerente_operativo role
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.slug IN ('super_admin', 'gerente_general', 'director_comercial', 'gerente_operativo')
      AND r.is_active = true
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_org_admin IS 'Returns true if user has admin/management role (super_admin, gerente_general, director_comercial, gerente_operativo)';

-- Function: is_commercial_manager
-- Check if user has gerente_comercial role or higher
CREATE OR REPLACE FUNCTION public.is_commercial_manager()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.slug IN ('super_admin', 'gerente_general', 'director_comercial', 'gerente_comercial')
      AND r.is_active = true
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_commercial_manager IS 'Returns true if user has commercial manager role or higher';

-- Function: has_perm
-- Check if user has a specific permission slug
CREATE OR REPLACE FUNCTION public.has_perm(p_slug text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND p.slug = p_slug
      AND r.is_active = true
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_perm IS 'Returns true if user has a specific permission (module:action format)';

-- ============================================================================
-- PART 2: ENABLE RLS ON ALL BUSINESS TABLES (45 tables)
-- ============================================================================

-- Domain 1: Organizations and Users
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Domain 2: Customers and Leads
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments_log ENABLE ROW LEVEL SECURITY;

-- Domain 3: Products and Catalog
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trm_rates ENABLE ROW LEVEL SECURITY;

-- Domain 4: Quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_follow_ups ENABLE ROW LEVEL SECURITY;

-- Domain 5: Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_pending_tasks ENABLE ROW LEVEL SECURITY;

-- Domain 6: Suppliers and Purchase Orders
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Domain 7: Logistics and Shipments
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;

-- Domain 8: Invoicing
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Domain 9: Licenses
ALTER TABLE license_records ENABLE ROW LEVEL SECURITY;

-- Domain 10: WhatsApp Integration
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Domain 11: Notifications and Communication
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Domain 12: Audit and Configuration
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejection_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE consecutive_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Domain 13: Product Traceability
ALTER TABLE product_route_events ENABLE ROW LEVEL SECURITY;

-- Domain 14: Reports and Dashboard
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: RLS POLICIES BY TABLE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DOMAIN 1: ORGANIZATIONS AND USERS
-- ----------------------------------------------------------------------------

-- Table: organizations
-- Users can only read their own organization, admins can update
CREATE POLICY "organizations_select"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = public.get_user_org_id());

CREATE POLICY "organizations_update"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id = public.get_user_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (
    id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: profiles
-- All users in org can see profiles, users can update their own or admins can update all
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR (organization_id = public.get_user_org_id() AND public.has_perm('admin:manage_users'))
  )
  WITH CHECK (
    id = auth.uid()
    OR (organization_id = public.get_user_org_id() AND public.has_perm('admin:manage_users'))
  );

-- Table: roles
-- All users can see roles, only admins can modify
CREATE POLICY "roles_select"
  ON roles FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "roles_insert"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

CREATE POLICY "roles_update"
  ON roles FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

CREATE POLICY "roles_delete"
  ON roles FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: permissions
-- Global table (no organization_id), read-only for authenticated users
-- Write access only via service_role
CREATE POLICY "permissions_select"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Table: role_permissions
-- Access via role's organization
CREATE POLICY "role_permissions_select"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "role_permissions_insert"
  ON role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.organization_id = public.get_user_org_id()
        AND public.is_org_admin()
    )
  );

CREATE POLICY "role_permissions_delete"
  ON role_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.organization_id = public.get_user_org_id()
        AND public.is_org_admin()
    )
  );

-- Table: user_roles
-- Access via user's organization
CREATE POLICY "user_roles_select"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
        AND p.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "user_roles_insert"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
        AND p.organization_id = public.get_user_org_id()
        AND public.is_org_admin()
    )
  );

CREATE POLICY "user_roles_delete"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
        AND p.organization_id = public.get_user_org_id()
        AND public.is_org_admin()
    )
  );

-- ----------------------------------------------------------------------------
-- DOMAIN 2: CUSTOMERS AND LEADS
-- ----------------------------------------------------------------------------

-- Table: customers (Tenant Isolation)
CREATE POLICY "customers_select"
  ON customers FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "customers_insert"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "customers_update"
  ON customers FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "customers_delete"
  ON customers FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: customer_contacts (Tenant Isolation)
CREATE POLICY "customer_contacts_select"
  ON customer_contacts FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "customer_contacts_insert"
  ON customer_contacts FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "customer_contacts_update"
  ON customer_contacts FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "customer_contacts_delete"
  ON customer_contacts FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Table: leads (Data Scope - assigned_to filtering)
CREATE POLICY "leads_select"
  ON leads FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND (
      public.is_commercial_manager()  -- Managers see all
      OR assigned_to = auth.uid()   -- Advisors see assigned
      OR created_by = auth.uid()    -- Or created by them
    )
  );

CREATE POLICY "leads_insert"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "leads_update"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND (
      public.is_commercial_manager()
      OR assigned_to = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND (
      public.is_commercial_manager()
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "leads_delete"
  ON leads FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: lead_assignments_log (Tenant Isolation, read-only for users)
CREATE POLICY "lead_assignments_log_select"
  ON lead_assignments_log FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "lead_assignments_log_insert"
  ON lead_assignments_log FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 3: PRODUCTS AND CATALOG
-- ----------------------------------------------------------------------------

-- Table: product_categories (Tenant Isolation)
CREATE POLICY "product_categories_select"
  ON product_categories FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "product_categories_insert"
  ON product_categories FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "product_categories_update"
  ON product_categories FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "product_categories_delete"
  ON product_categories FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: products (Tenant Isolation)
CREATE POLICY "products_select"
  ON products FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "products_insert"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "products_update"
  ON products FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "products_delete"
  ON products FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: margin_rules (Tenant Isolation)
CREATE POLICY "margin_rules_select"
  ON margin_rules FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "margin_rules_insert"
  ON margin_rules FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "margin_rules_update"
  ON margin_rules FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "margin_rules_delete"
  ON margin_rules FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Table: trm_rates (Tenant Isolation, read-only for most users)
CREATE POLICY "trm_rates_select"
  ON trm_rates FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "trm_rates_insert"
  ON trm_rates FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 4: QUOTES
-- ----------------------------------------------------------------------------

-- Table: quotes (Data Scope - advisor_id filtering)
CREATE POLICY "quotes_select"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND (
      public.is_commercial_manager()
      OR advisor_id = auth.uid()
      OR public.has_perm('quotes:read') -- Finanzas/other roles can see all
    )
  );

CREATE POLICY "quotes_insert"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "quotes_update"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND (
      public.is_commercial_manager()
      OR advisor_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND (
      public.is_commercial_manager()
      OR advisor_id = auth.uid()
    )
  );

CREATE POLICY "quotes_delete"
  ON quotes FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: quote_items (Access via parent quote)
CREATE POLICY "quote_items_select"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "quote_items_insert"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "quote_items_update"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = public.get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "quote_items_delete"
  ON quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.organization_id = public.get_user_org_id()
    )
  );

-- Table: quote_approvals (Tenant Isolation)
CREATE POLICY "quote_approvals_select"
  ON quote_approvals FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "quote_approvals_insert"
  ON quote_approvals FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "quote_approvals_update"
  ON quote_approvals FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Table: quote_follow_ups (Tenant Isolation)
CREATE POLICY "quote_follow_ups_select"
  ON quote_follow_ups FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "quote_follow_ups_insert"
  ON quote_follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "quote_follow_ups_update"
  ON quote_follow_ups FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "quote_follow_ups_delete"
  ON quote_follow_ups FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 5: ORDERS
-- ----------------------------------------------------------------------------

-- Table: orders (All roles can see, limited update/delete)
CREATE POLICY "orders_select"
  ON orders FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "orders_insert"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "orders_update"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND (
      public.is_org_admin()
      OR public.is_commercial_manager()
      OR advisor_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND (
      public.is_org_admin()
      OR public.is_commercial_manager()
      OR advisor_id = auth.uid()
    )
  );

CREATE POLICY "orders_delete"
  ON orders FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: order_items (Access via parent order)
CREATE POLICY "order_items_select"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "order_items_insert"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "order_items_update"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.organization_id = public.get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.organization_id = public.get_user_org_id()
    )
  );

-- Table: order_status_history (Access via parent order, read-only)
CREATE POLICY "order_status_history_select"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
        AND o.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "order_status_history_insert"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
        AND o.organization_id = public.get_user_org_id()
    )
  );

-- Table: order_documents (Tenant Isolation)
CREATE POLICY "order_documents_select"
  ON order_documents FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "order_documents_insert"
  ON order_documents FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "order_documents_delete"
  ON order_documents FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Table: order_pending_tasks (Tenant Isolation)
CREATE POLICY "order_pending_tasks_select"
  ON order_pending_tasks FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "order_pending_tasks_insert"
  ON order_pending_tasks FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "order_pending_tasks_update"
  ON order_pending_tasks FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "order_pending_tasks_delete"
  ON order_pending_tasks FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 6: SUPPLIERS AND PURCHASE ORDERS
-- ----------------------------------------------------------------------------

-- Table: suppliers (Tenant Isolation)
CREATE POLICY "suppliers_select"
  ON suppliers FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "suppliers_insert"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "suppliers_update"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "suppliers_delete"
  ON suppliers FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: purchase_orders (Tenant Isolation)
CREATE POLICY "purchase_orders_select"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "purchase_orders_insert"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "purchase_orders_update"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "purchase_orders_delete"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: purchase_order_items (Access via parent PO)
CREATE POLICY "purchase_order_items_select"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "purchase_order_items_insert"
  ON purchase_order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "purchase_order_items_update"
  ON purchase_order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.organization_id = public.get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "purchase_order_items_delete"
  ON purchase_order_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.organization_id = public.get_user_org_id()
    )
  );

-- ----------------------------------------------------------------------------
-- DOMAIN 7: LOGISTICS AND SHIPMENTS
-- ----------------------------------------------------------------------------

-- Table: shipments (Tenant Isolation)
CREATE POLICY "shipments_select"
  ON shipments FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "shipments_insert"
  ON shipments FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "shipments_update"
  ON shipments FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Table: shipment_items (Access via parent shipment)
CREATE POLICY "shipment_items_select"
  ON shipment_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = shipment_items.shipment_id
        AND s.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "shipment_items_insert"
  ON shipment_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = shipment_items.shipment_id
        AND s.organization_id = public.get_user_org_id()
    )
  );

-- ----------------------------------------------------------------------------
-- DOMAIN 8: INVOICING
-- ----------------------------------------------------------------------------

-- Table: invoices (Tenant Isolation)
CREATE POLICY "invoices_select"
  ON invoices FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "invoices_insert"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "invoices_update"
  ON invoices FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "invoices_delete"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- Table: invoice_items (Access via parent invoice)
CREATE POLICY "invoice_items_select"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "invoice_items_insert"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.organization_id = public.get_user_org_id()
    )
  );

-- ----------------------------------------------------------------------------
-- DOMAIN 9: LICENSES AND INTANGIBLES
-- ----------------------------------------------------------------------------

-- Table: license_records (Tenant Isolation)
CREATE POLICY "license_records_select"
  ON license_records FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "license_records_insert"
  ON license_records FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "license_records_update"
  ON license_records FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 10: WHATSAPP INTEGRATION
-- ----------------------------------------------------------------------------

-- Table: whatsapp_accounts (Tenant Isolation)
CREATE POLICY "whatsapp_accounts_select"
  ON whatsapp_accounts FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "whatsapp_accounts_insert"
  ON whatsapp_accounts FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "whatsapp_accounts_update"
  ON whatsapp_accounts FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Table: whatsapp_templates (Tenant Isolation)
CREATE POLICY "whatsapp_templates_select"
  ON whatsapp_templates FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "whatsapp_templates_insert"
  ON whatsapp_templates FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "whatsapp_templates_update"
  ON whatsapp_templates FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "whatsapp_templates_delete"
  ON whatsapp_templates FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Table: whatsapp_conversations (Tenant Isolation)
CREATE POLICY "whatsapp_conversations_select"
  ON whatsapp_conversations FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "whatsapp_conversations_insert"
  ON whatsapp_conversations FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "whatsapp_conversations_update"
  ON whatsapp_conversations FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Table: whatsapp_messages (Tenant Isolation, read-only for most)
CREATE POLICY "whatsapp_messages_select"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "whatsapp_messages_insert"
  ON whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 11: NOTIFICATIONS AND COMMUNICATION
-- ----------------------------------------------------------------------------

-- Table: notifications (User can only see their own)
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Table: comments (Tenant Isolation with author ownership)
CREATE POLICY "comments_select"
  ON comments FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "comments_insert"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND author_id = auth.uid()
  );

CREATE POLICY "comments_update"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND author_id = auth.uid()
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND author_id = auth.uid()
  );

CREATE POLICY "comments_delete"
  ON comments FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND (author_id = auth.uid() OR public.is_org_admin())
  );

-- Table: email_logs (Tenant Isolation)
CREATE POLICY "email_logs_select"
  ON email_logs FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "email_logs_insert"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "email_logs_update"
  ON email_logs FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 12: AUDIT AND CONFIGURATION
-- ----------------------------------------------------------------------------

-- Table: audit_logs (Read-only for admins, insert via service_role)
CREATE POLICY "audit_logs_select"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.has_perm('admin:view_audit')
  );

CREATE POLICY "audit_logs_insert_service"
  ON audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Table: rejection_reasons (Tenant Isolation)
CREATE POLICY "rejection_reasons_select"
  ON rejection_reasons FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "rejection_reasons_insert"
  ON rejection_reasons FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "rejection_reasons_update"
  ON rejection_reasons FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "rejection_reasons_delete"
  ON rejection_reasons FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Table: consecutive_counters (Tenant Isolation)
CREATE POLICY "consecutive_counters_select"
  ON consecutive_counters FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "consecutive_counters_insert"
  ON consecutive_counters FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "consecutive_counters_update"
  ON consecutive_counters FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "consecutive_counters_delete"
  ON consecutive_counters FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Table: system_settings (Tenant Isolation)
CREATE POLICY "system_settings_select"
  ON system_settings FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "system_settings_insert"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "system_settings_update"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "system_settings_delete"
  ON system_settings FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 13: PRODUCT TRACEABILITY
-- ----------------------------------------------------------------------------

-- Table: product_route_events (Tenant Isolation, read-only for most)
CREATE POLICY "product_route_events_select"
  ON product_route_events FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "product_route_events_insert"
  ON product_route_events FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

-- ----------------------------------------------------------------------------
-- DOMAIN 14: REPORTS AND DASHBOARD
-- ----------------------------------------------------------------------------

-- Table: dashboard_widgets (User-specific + org isolation)
CREATE POLICY "dashboard_widgets_select"
  ON dashboard_widgets FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "dashboard_widgets_insert"
  ON dashboard_widgets FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "dashboard_widgets_update"
  ON dashboard_widgets FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "dashboard_widgets_delete"
  ON dashboard_widgets FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  );

-- Table: saved_reports (User-specific or shared)
CREATE POLICY "saved_reports_select"
  ON saved_reports FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND (user_id = auth.uid() OR is_shared = true)
  );

CREATE POLICY "saved_reports_insert"
  ON saved_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "saved_reports_update"
  ON saved_reports FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "saved_reports_delete"
  ON saved_reports FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  );

-- ============================================================================
-- PART 4: CRITICAL INDEXES FOR RLS PERFORMANCE
-- ============================================================================

-- Index on profiles for public.get_user_org_id() (already exists as PK)
-- CREATE INDEX idx_profiles_id ON profiles(id); -- Already exists as PRIMARY KEY

-- Index on user_roles for role verification functions
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role_id);

-- Index on roles for slug lookup
CREATE INDEX IF NOT EXISTS idx_roles_slug_active ON roles(slug, is_active) WHERE is_active = true;

-- Composite indexes for data scope policies
CREATE INDEX IF NOT EXISTS idx_leads_org_assigned ON leads(organization_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_quotes_org_advisor ON quotes(organization_id, advisor_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_advisor ON orders(organization_id, advisor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id, organization_id);

-- ============================================================================
-- SUMMARY COMMENT
-- ============================================================================

COMMENT ON SCHEMA public IS
'Pscomercial-pro RLS Policies - Migration: 20260212000002_rls_policies.sql

RLS STRATEGY:
- Multi-tenant isolation via organization_id on all business tables
- Data scope filtering for leads (assigned_to), quotes (advisor_id), orders (advisor_id)
- Special policies for notifications (user-specific), audit_logs (admin-only read)
- Child tables inherit access via parent table lookup
- permissions table is global (no org_id), read-only for authenticated users

HELPER FUNCTIONS:
1. public.get_user_org_id() - Returns org_id for current user (STABLE)
2. public.is_org_admin() - Check if user has admin/management role
3. public.is_commercial_manager() - Check if user has commercial manager role+
4. public.has_perm(slug) - Check specific permission

POLICIES APPLIED:
- 45 tables with RLS enabled
- SELECT, INSERT, UPDATE, DELETE policies based on role and ownership
- Tenant isolation enforced at database level
- Service role bypasses RLS automatically (Supabase default)

PERFORMANCE:
- STABLE functions cached per transaction
- Critical indexes on organization_id, user_id, assigned_to, advisor_id
- Composite indexes for frequent policy checks

NEXT STEPS:
- Test policies with different user roles
- Monitor query performance with EXPLAIN ANALYZE
- Implement audit_trail_trigger in future migration
';
