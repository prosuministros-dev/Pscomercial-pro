-- ============================================================================
-- PSCOMERCIAL-PRO - BUSINESS SCHEMA MIGRATION
-- Migration: 20260212000001_business_schema.sql
-- Date: 2026-02-12
-- Description: Complete business schema with 45 tables across 14 domains
-- Base: PostgreSQL 15 (Supabase)
-- Multi-tenant: organization_id in all business tables
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimizations

-- ============================================================================
-- DOMAIN 1: ORGANIZATIONS AND USERS (6 tables)
-- ============================================================================

-- Table: organizations
-- Root table for multi-tenant architecture
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  nit varchar(20) NOT NULL UNIQUE,
  logo_url text,
  domain varchar(100),
  plan varchar(50) NOT NULL DEFAULT 'standard',
  settings jsonb NOT NULL DEFAULT '{}',
  max_users integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_nit ON organizations(nit);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

COMMENT ON TABLE organizations IS 'Root multi-tenant table. Each organization represents a client company.';

-- Table: profiles
-- Extended user profile linked to auth.users
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  full_name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(20),
  avatar_url text,
  area varchar(100),
  position varchar(100),
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  max_pending_leads integer NOT NULL DEFAULT 5,
  preferences jsonb NOT NULL DEFAULT '{}',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_profiles_org_active ON profiles(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_email ON profiles(email);

COMMENT ON TABLE profiles IS 'Extended user profile. id references auth.users for authentication.';

-- Table: roles
-- Configurable roles per organization
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name varchar(100) NOT NULL,
  slug varchar(100) NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_roles_org ON roles(organization_id);
CREATE UNIQUE INDEX idx_roles_org_slug ON roles(organization_id, slug);

COMMENT ON TABLE roles IS 'System and custom roles. 12 predefined system roles (super_admin, gerente_general, etc.)';

-- Table: permissions
-- Granular permissions with module:action format
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module varchar(50) NOT NULL,
  action varchar(50) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_slug ON permissions(slug);

COMMENT ON TABLE permissions IS 'Granular permissions. Format: module:action (e.g., leads:create, quotes:approve)';

-- Table: role_permissions
-- Pivot table: N:M relationship between roles and permissions
CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE UNIQUE INDEX idx_role_permissions_unique ON role_permissions(role_id, permission_id);

COMMENT ON TABLE role_permissions IS 'Pivot table for role-permission assignments';

-- Table: user_roles
-- Pivot table: N:M relationship between users and roles
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE UNIQUE INDEX idx_user_roles_unique ON user_roles(user_id, role_id);

COMMENT ON TABLE user_roles IS 'Pivot table for user-role assignments. Users can have multiple roles.';

-- ============================================================================
-- DOMAIN 2: CUSTOMERS AND LEADS (4 tables)
-- ============================================================================

-- Table: customers
-- Customer companies. Leads convert to customers upon validation.
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  business_name varchar(255) NOT NULL,
  nit varchar(20) NOT NULL,
  industry varchar(100),
  address text,
  city varchar(100),
  phone varchar(20),
  email varchar(255),
  website varchar(255),
  credit_limit numeric(15,2) NOT NULL DEFAULT 0,
  credit_available numeric(15,2) NOT NULL DEFAULT 0,
  credit_status varchar(20) NOT NULL DEFAULT 'pending',
  payment_terms varchar(50),
  outstanding_balance numeric(15,2) NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  block_reason text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_credit_limit_non_negative CHECK (credit_limit >= 0),
  CONSTRAINT chk_credit_status CHECK (credit_status IN ('pending', 'approved', 'blocked', 'suspended'))
);

CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE UNIQUE INDEX idx_customers_org_nit ON customers(organization_id, nit);
CREATE INDEX idx_customers_org_name ON customers(organization_id, business_name);
CREATE INDEX idx_customers_blocked ON customers(organization_id, is_blocked) WHERE is_blocked = true;

COMMENT ON TABLE customers IS 'Customer companies with credit management';

-- Table: customer_contacts
-- Multiple contacts per customer
CREATE TABLE customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  full_name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(20),
  position varchar(100),
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_contacts_customer ON customer_contacts(customer_id);
CREATE INDEX idx_customer_contacts_org ON customer_contacts(organization_id);

COMMENT ON TABLE customer_contacts IS 'Multiple contacts per customer company';

-- Table: leads
-- Leads captured via WhatsApp bot, web form, or manual entry
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lead_number integer NOT NULL,
  business_name varchar(255) NOT NULL,
  nit varchar(20),
  contact_name varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(255) NOT NULL,
  requirement text NOT NULL,
  channel varchar(20) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'created',
  rejection_reason_id uuid,
  rejection_notes text,
  customer_id uuid REFERENCES customers(id),
  assigned_to uuid REFERENCES profiles(id),
  assigned_at timestamptz,
  assigned_by uuid REFERENCES auth.users(id),
  converted_at timestamptz,
  lead_date timestamptz NOT NULL DEFAULT now(),
  source_conversation_id uuid,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_lead_status CHECK (status IN ('created', 'pending_assignment', 'assigned', 'converted', 'rejected', 'pending_info')),
  CONSTRAINT chk_lead_channel CHECK (channel IN ('whatsapp', 'web', 'manual'))
);

CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE UNIQUE INDEX idx_leads_org_number ON leads(organization_id, lead_number);
CREATE INDEX idx_leads_org_status ON leads(organization_id, status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to) WHERE status IN ('assigned', 'pending_assignment');
CREATE INDEX idx_leads_org_nit ON leads(organization_id, nit);
CREATE INDEX idx_leads_org_email ON leads(organization_id, email);
CREATE INDEX idx_leads_created ON leads(organization_id, created_at DESC);

COMMENT ON TABLE leads IS 'Leads from WhatsApp bot, web form, or manual entry. Auto-assignment based on load balancing.';

-- Table: lead_assignments_log
-- Audit log for lead assignments and reassignments
CREATE TABLE lead_assignments_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES profiles(id),
  to_user_id uuid NOT NULL REFERENCES profiles(id),
  assignment_type varchar(20) NOT NULL,
  reason text,
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_assignment_type CHECK (assignment_type IN ('automatic', 'manual', 'reassignment'))
);

CREATE INDEX idx_lead_assignments_lead ON lead_assignments_log(lead_id);
CREATE INDEX idx_lead_assignments_org ON lead_assignments_log(organization_id, created_at DESC);

COMMENT ON TABLE lead_assignments_log IS 'Audit log for lead assignments and reassignments';

-- ============================================================================
-- DOMAIN 3: PRODUCTS AND CATALOG (4 tables)
-- ============================================================================

-- Table: product_categories
-- Hierarchical product categories for margin rules
CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL,
  parent_id uuid REFERENCES product_categories(id),
  level integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_categories_org ON product_categories(organization_id);
CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
CREATE UNIQUE INDEX idx_product_categories_org_slug ON product_categories(organization_id, slug);

COMMENT ON TABLE product_categories IS 'Hierarchical product categories for margin tree';

-- Table: products
-- Product and service catalog
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  sku varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  category_id uuid REFERENCES product_categories(id),
  brand varchar(100),
  unit_cost_usd numeric(15,4) NOT NULL DEFAULT 0,
  unit_cost_cop numeric(15,2) NOT NULL DEFAULT 0,
  suggested_price_cop numeric(15,2),
  currency varchar(3) NOT NULL DEFAULT 'COP',
  is_service boolean NOT NULL DEFAULT false,
  is_license boolean NOT NULL DEFAULT false,
  requires_activation boolean NOT NULL DEFAULT false,
  warranty_months integer,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_product_currency CHECK (currency IN ('COP', 'USD'))
);

CREATE INDEX idx_products_org ON products(organization_id);
CREATE UNIQUE INDEX idx_products_org_sku ON products(organization_id, sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_org_name ON products(organization_id, name);

COMMENT ON TABLE products IS 'Product and service catalog with license support';

-- Table: margin_rules
-- Margin assignment tree by category and payment type
CREATE TABLE margin_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  category_id uuid REFERENCES product_categories(id),
  payment_type varchar(30) NOT NULL,
  min_margin_pct numeric(5,2) NOT NULL,
  target_margin_pct numeric(5,2) NOT NULL,
  max_discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  requires_approval_below numeric(5,2) NOT NULL,
  approval_role_slug varchar(100) NOT NULL DEFAULT 'gerente_comercial',
  is_active boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_until date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_payment_type CHECK (payment_type IN ('anticipated', 'credit_30', 'credit_60', 'credit_90'))
);

CREATE INDEX idx_margin_rules_org ON margin_rules(organization_id);
CREATE INDEX idx_margin_rules_category ON margin_rules(organization_id, category_id, payment_type);
CREATE INDEX idx_margin_rules_active ON margin_rules(organization_id, is_active) WHERE is_active = true;

COMMENT ON TABLE margin_rules IS 'Margin percentage rules by category and payment terms';

-- Table: trm_rates
-- Daily TRM (exchange rate) for USD to COP conversion
CREATE TABLE trm_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  rate_date date NOT NULL,
  rate_value numeric(10,2) NOT NULL,
  source varchar(50) NOT NULL DEFAULT 'manual',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_trm_source CHECK (source IN ('manual', 'api_banrep', 'api_superfinanciera'))
);

CREATE UNIQUE INDEX idx_trm_rates_org_date ON trm_rates(organization_id, rate_date);
CREATE INDEX idx_trm_rates_latest ON trm_rates(organization_id, rate_date DESC);

COMMENT ON TABLE trm_rates IS 'Daily exchange rate (TRM) for USD to COP conversion';

-- ============================================================================
-- DOMAIN 4: QUOTES (4 tables)
-- ============================================================================

-- Table: quotes
-- Quotes generated from validated leads
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  quote_number integer NOT NULL,
  lead_id uuid REFERENCES leads(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  contact_id uuid,
  advisor_id uuid NOT NULL REFERENCES profiles(id),
  quote_date timestamptz NOT NULL DEFAULT now(),
  validity_days integer NOT NULL DEFAULT 30,
  expires_at timestamptz NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'draft',
  currency varchar(3) NOT NULL DEFAULT 'COP',
  trm_applied numeric(10,2),
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  transport_cost numeric(15,2) NOT NULL DEFAULT 0,
  transport_included boolean NOT NULL DEFAULT false,
  total numeric(15,2) NOT NULL DEFAULT 0,
  margin_pct numeric(5,2),
  margin_approved boolean NOT NULL DEFAULT false,
  margin_approved_by uuid REFERENCES auth.users(id),
  margin_approved_at timestamptz,
  payment_terms varchar(50) NOT NULL,
  credit_validated boolean NOT NULL DEFAULT false,
  credit_validation_result jsonb,
  proforma_url text,
  proforma_generated_at timestamptz,
  sent_to_client boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  sent_via varchar(20),
  loss_reason text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_quote_status CHECK (status IN ('draft', 'offer_created', 'negotiation', 'risk', 'pending_oc', 'approved', 'rejected', 'lost', 'expired')),
  CONSTRAINT chk_quote_currency CHECK (currency IN ('COP', 'USD')),
  CONSTRAINT chk_quote_sent_via CHECK (sent_via IS NULL OR sent_via IN ('email', 'whatsapp', 'both'))
);

CREATE INDEX idx_quotes_org ON quotes(organization_id);
CREATE UNIQUE INDEX idx_quotes_org_number ON quotes(organization_id, quote_number);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_advisor ON quotes(advisor_id);
CREATE INDEX idx_quotes_status ON quotes(organization_id, status);
CREATE INDEX idx_quotes_org_date ON quotes(organization_id, quote_date DESC);
CREATE INDEX idx_quotes_lead ON quotes(lead_id);
CREATE INDEX idx_quotes_expires ON quotes(organization_id, expires_at) WHERE status NOT IN ('approved', 'rejected', 'lost');

COMMENT ON TABLE quotes IS 'Quotes with margin validation and proforma generation';

-- Table: quote_items
-- Quote line items with drag-and-drop ordering
CREATE TABLE quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  sort_order integer NOT NULL DEFAULT 0,
  sku varchar(50) NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(15,4) NOT NULL,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  tax_pct numeric(5,2) NOT NULL DEFAULT 19,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  total numeric(15,2) NOT NULL DEFAULT 0,
  cost_price numeric(15,4) NOT NULL DEFAULT 0,
  margin_pct numeric(5,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_unit_price_non_negative CHECK (unit_price >= 0)
);

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON quote_items(product_id);
CREATE INDEX idx_quote_items_order ON quote_items(quote_id, sort_order);

COMMENT ON TABLE quote_items IS 'Quote line items with sortable order';

-- Table: quote_approvals
-- Margin approval requests when margin is below threshold
CREATE TABLE quote_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  current_margin_pct numeric(5,2) NOT NULL,
  min_margin_required numeric(5,2) NOT NULL,
  justification text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_approval_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_quote_approvals_quote ON quote_approvals(quote_id);
CREATE INDEX idx_quote_approvals_org_status ON quote_approvals(organization_id, status) WHERE status = 'pending';

COMMENT ON TABLE quote_approvals IS 'Margin approval workflow for low-margin quotes';

-- Table: quote_follow_ups
-- Automated follow-up reminders and alerts
CREATE TABLE quote_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  follow_up_type varchar(30) NOT NULL,
  scheduled_at timestamptz NOT NULL,
  executed_at timestamptz,
  channel varchar(20) NOT NULL DEFAULT 'internal',
  message text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_followup_type CHECK (follow_up_type IN ('reminder', 'escalation', 'expiration_warning', 'manual')),
  CONSTRAINT chk_followup_channel CHECK (channel IN ('internal', 'email', 'whatsapp')),
  CONSTRAINT chk_followup_status CHECK (status IN ('pending', 'sent', 'cancelled'))
);

CREATE INDEX idx_quote_followups_org ON quote_follow_ups(organization_id);
CREATE INDEX idx_quote_followups_pending ON quote_follow_ups(organization_id, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_quote_followups_quote ON quote_follow_ups(quote_id);

COMMENT ON TABLE quote_follow_ups IS 'Automated and manual follow-up reminders for quotes';

-- ============================================================================
-- DOMAIN 5: ORDERS (5 tables)
-- ============================================================================

-- Table: orders
-- Orders created from approved quotes
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  order_number integer NOT NULL,
  quote_id uuid NOT NULL REFERENCES quotes(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  advisor_id uuid NOT NULL REFERENCES profiles(id),
  status varchar(30) NOT NULL DEFAULT 'created',
  payment_status varchar(30) NOT NULL DEFAULT 'pending',
  payment_terms varchar(50) NOT NULL,
  requires_advance_billing boolean NOT NULL DEFAULT false,
  currency varchar(3) NOT NULL DEFAULT 'COP',
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  total numeric(15,2) NOT NULL DEFAULT 0,
  delivery_date timestamptz,
  delivery_address text,
  delivery_city varchar(100),
  delivery_contact varchar(255),
  delivery_phone varchar(20),
  delivery_schedule varchar(100),
  dispatch_type varchar(30),
  notes text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_order_status CHECK (status IN ('created', 'payment_pending', 'payment_confirmed', 'available_for_purchase', 'in_purchase', 'partial_delivery', 'in_logistics', 'delivered', 'invoiced', 'completed', 'cancelled')),
  CONSTRAINT chk_payment_status CHECK (payment_status IN ('pending', 'confirmed', 'partial', 'overdue')),
  CONSTRAINT chk_dispatch_type CHECK (dispatch_type IS NULL OR dispatch_type IN ('envio', 'retiro', 'mensajeria'))
);

CREATE INDEX idx_orders_org ON orders(organization_id);
CREATE UNIQUE INDEX idx_orders_org_number ON orders(organization_id, order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_advisor ON orders(advisor_id);
CREATE INDEX idx_orders_status ON orders(organization_id, status);
CREATE INDEX idx_orders_quote ON orders(quote_id);
CREATE INDEX idx_orders_org_date ON orders(organization_id, created_at DESC);

COMMENT ON TABLE orders IS 'Orders created from approved quotes. Commercial data locked, operational data editable.';

-- Table: order_items
-- Order line items (inherited from quote, commercial data locked)
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  quote_item_id uuid,
  product_id uuid REFERENCES products(id),
  sku varchar(50) NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  quantity_purchased numeric(10,2) NOT NULL DEFAULT 0,
  quantity_received numeric(10,2) NOT NULL DEFAULT 0,
  quantity_dispatched numeric(10,2) NOT NULL DEFAULT 0,
  quantity_delivered numeric(10,2) NOT NULL DEFAULT 0,
  unit_price numeric(15,4) NOT NULL,
  subtotal numeric(15,2) NOT NULL,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  total numeric(15,2) NOT NULL,
  item_status varchar(30) NOT NULL DEFAULT 'pending',
  is_license boolean NOT NULL DEFAULT false,
  license_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_item_status CHECK (item_status IN ('pending', 'purchased', 'partial_received', 'received', 'dispatched', 'delivered'))
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_status ON order_items(item_status);

COMMENT ON TABLE order_items IS 'Order line items with quantity tracking through fulfillment stages';

-- Table: order_status_history
-- Audit trail for order status changes
CREATE TABLE order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status varchar(30),
  to_status varchar(30) NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id, created_at DESC);

COMMENT ON TABLE order_status_history IS 'Complete audit trail of order status transitions';

-- Table: order_documents
-- Documents attached to orders (PO, invoices, guides, receipts)
CREATE TABLE order_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  document_type varchar(30) NOT NULL,
  file_name varchar(255) NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type varchar(100),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_document_type CHECK (document_type IN ('purchase_order', 'invoice', 'guide', 'receipt', 'proforma', 'other'))
);

CREATE INDEX idx_order_documents_order ON order_documents(order_id);
CREATE INDEX idx_order_documents_type ON order_documents(order_id, document_type);

COMMENT ON TABLE order_documents IS 'Document attachments for orders';

-- Table: order_pending_tasks
-- Operational tasks with traffic light indicators
CREATE TABLE order_pending_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES order_items(id),
  task_type varchar(30) NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  priority varchar(10) NOT NULL DEFAULT 'medium',
  traffic_light varchar(10) NOT NULL DEFAULT 'green',
  due_date timestamptz,
  assigned_to uuid REFERENCES profiles(id),
  status varchar(20) NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_task_type CHECK (task_type IN ('purchase', 'reception', 'dispatch', 'delivery', 'billing', 'license_activation')),
  CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT chk_traffic_light CHECK (traffic_light IN ('green', 'yellow', 'red')),
  CONSTRAINT chk_task_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

CREATE INDEX idx_order_pending_org ON order_pending_tasks(organization_id);
CREATE INDEX idx_order_pending_order ON order_pending_tasks(order_id);
CREATE INDEX idx_order_pending_assigned ON order_pending_tasks(assigned_to) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_order_pending_traffic ON order_pending_tasks(organization_id, traffic_light) WHERE status != 'completed';
CREATE INDEX idx_order_pending_due ON order_pending_tasks(organization_id, due_date) WHERE status IN ('pending', 'in_progress');

COMMENT ON TABLE order_pending_tasks IS 'Operational task tracking with visual traffic light indicators';

-- ============================================================================
-- DOMAIN 6: SUPPLIERS AND PURCHASE ORDERS (3 tables)
-- ============================================================================

-- Table: suppliers
-- Supplier directory
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name varchar(255) NOT NULL,
  nit varchar(20),
  contact_name varchar(255),
  email varchar(255),
  phone varchar(20),
  address text,
  city varchar(100),
  country varchar(100) NOT NULL DEFAULT 'Colombia',
  payment_terms varchar(50),
  lead_time_days integer,
  rating numeric(3,1),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX idx_suppliers_org_name ON suppliers(organization_id, name);

COMMENT ON TABLE suppliers IS 'Supplier directory with performance tracking';

-- Table: purchase_orders
-- Purchase orders to suppliers
CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  po_number integer NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  status varchar(30) NOT NULL DEFAULT 'draft',
  currency varchar(3) NOT NULL DEFAULT 'COP',
  trm_applied numeric(10,2),
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  total numeric(15,2) NOT NULL DEFAULT 0,
  expected_delivery_date timestamptz,
  actual_delivery_date timestamptz,
  notes text,
  document_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_po_status CHECK (status IN ('draft', 'sent', 'confirmed', 'partial_received', 'received', 'cancelled'))
);

CREATE INDEX idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE UNIQUE INDEX idx_purchase_orders_org_number ON purchase_orders(organization_id, po_number);
CREATE INDEX idx_purchase_orders_order ON purchase_orders(order_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(organization_id, status);

COMMENT ON TABLE purchase_orders IS 'Purchase orders to suppliers linked to customer orders';

-- Table: purchase_order_items
-- Purchase order line items
CREATE TABLE purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  product_id uuid REFERENCES products(id),
  sku varchar(50) NOT NULL,
  description text NOT NULL,
  quantity_ordered numeric(10,2) NOT NULL,
  quantity_received numeric(10,2) NOT NULL DEFAULT 0,
  unit_cost numeric(15,4) NOT NULL,
  subtotal numeric(15,2) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  received_at timestamptz,
  received_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_po_item_status CHECK (status IN ('pending', 'partial', 'received'))
);

CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_order_item ON purchase_order_items(order_item_id);

COMMENT ON TABLE purchase_order_items IS 'Line items for purchase orders with reception tracking';

-- ============================================================================
-- DOMAIN 7: LOGISTICS AND SHIPMENTS (2 tables)
-- ============================================================================

-- Table: shipments
-- Shipments to customers
CREATE TABLE shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  shipment_number integer NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id),
  status varchar(30) NOT NULL DEFAULT 'preparing',
  dispatch_type varchar(30) NOT NULL,
  carrier varchar(255),
  tracking_number varchar(100),
  tracking_url text,
  delivery_address text NOT NULL,
  delivery_city varchar(100) NOT NULL,
  delivery_contact varchar(255) NOT NULL,
  delivery_phone varchar(20) NOT NULL,
  estimated_delivery timestamptz,
  actual_delivery timestamptz,
  dispatched_at timestamptz,
  dispatched_by uuid REFERENCES auth.users(id),
  received_by_name varchar(255),
  reception_notes text,
  proof_of_delivery_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_shipment_status CHECK (status IN ('preparing', 'dispatched', 'in_transit', 'delivered', 'returned')),
  CONSTRAINT chk_shipment_dispatch_type CHECK (dispatch_type IN ('envio', 'retiro', 'mensajeria'))
);

CREATE INDEX idx_shipments_org ON shipments(organization_id);
CREATE UNIQUE INDEX idx_shipments_org_number ON shipments(organization_id, shipment_number);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(organization_id, status);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);

COMMENT ON TABLE shipments IS 'Customer shipments with tracking information';

-- Table: shipment_items
-- Items included in a shipment (partial shipments supported)
CREATE TABLE shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  quantity_shipped numeric(10,2) NOT NULL,
  serial_numbers text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_order_item ON shipment_items(order_item_id);

COMMENT ON TABLE shipment_items IS 'Line items in shipments, supporting partial deliveries';

-- ============================================================================
-- DOMAIN 8: INVOICING (2 tables)
-- ============================================================================

-- Table: invoices
-- Manual invoice registration from external billing system
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  invoice_number varchar(50) NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  invoice_date date NOT NULL,
  due_date date,
  currency varchar(3) NOT NULL DEFAULT 'COP',
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  total numeric(15,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'pending',
  payment_date date,
  payment_method varchar(50),
  payment_reference varchar(100),
  document_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_invoice_status CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled'))
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE UNIQUE INDEX idx_invoices_org_number ON invoices(organization_id, invoice_number);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(organization_id, due_date) WHERE status IN ('pending', 'partial');

COMMENT ON TABLE invoices IS 'Manual invoice registration from external billing system';

-- Table: invoice_items
-- Invoice line items
CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES order_items(id),
  sku varchar(50) NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit_price numeric(15,4) NOT NULL,
  subtotal numeric(15,2) NOT NULL,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  total numeric(15,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

COMMENT ON TABLE invoice_items IS 'Line items for invoices';

-- ============================================================================
-- DOMAIN 9: LICENSES AND INTANGIBLES (1 table)
-- ============================================================================

-- Table: license_records
-- License and intangible asset tracking
CREATE TABLE license_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  product_id uuid REFERENCES products(id),
  license_type varchar(30) NOT NULL,
  license_key text,
  vendor varchar(255),
  activation_date date,
  expiry_date date,
  renewal_date date,
  seats integer,
  status varchar(20) NOT NULL DEFAULT 'pending',
  activation_notes text,
  end_user_name varchar(255),
  end_user_email varchar(255),
  document_url text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_license_type CHECK (license_type IN ('software', 'saas', 'hardware_warranty', 'support', 'subscription')),
  CONSTRAINT chk_license_status CHECK (status IN ('pending', 'active', 'expired', 'renewed', 'cancelled'))
);

CREATE INDEX idx_license_records_org ON license_records(organization_id);
CREATE INDEX idx_license_records_order ON license_records(order_id);
CREATE INDEX idx_license_records_expiry ON license_records(organization_id, expiry_date) WHERE status = 'active';
CREATE INDEX idx_license_records_renewal ON license_records(organization_id, renewal_date) WHERE status IN ('active', 'expired');

COMMENT ON TABLE license_records IS 'License and intangible asset tracking with expiration management';

-- ============================================================================
-- DOMAIN 10: WHATSAPP INTEGRATION (4 tables)
-- ============================================================================

-- Table: whatsapp_accounts
-- WhatsApp Business accounts per organization
CREATE TABLE whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  waba_id varchar(50) NOT NULL,
  phone_number_id varchar(50) NOT NULL,
  display_phone varchar(20) NOT NULL,
  business_name varchar(255) NOT NULL,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  webhook_verify_token varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  quality_rating varchar(20),
  messaging_limit varchar(20),
  setup_completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_wa_account_status CHECK (status IN ('pending', 'active', 'suspended', 'disconnected'))
);

CREATE UNIQUE INDEX idx_whatsapp_accounts_org ON whatsapp_accounts(organization_id);
CREATE INDEX idx_whatsapp_accounts_waba ON whatsapp_accounts(waba_id);
CREATE INDEX idx_whatsapp_accounts_phone ON whatsapp_accounts(phone_number_id);

COMMENT ON TABLE whatsapp_accounts IS 'WhatsApp Business accounts with Meta API integration';

-- Table: whatsapp_templates
-- Approved message templates from Meta
CREATE TABLE whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  whatsapp_account_id uuid NOT NULL REFERENCES whatsapp_accounts(id),
  meta_template_id varchar(100) NOT NULL,
  name varchar(100) NOT NULL,
  language varchar(10) NOT NULL DEFAULT 'es',
  category varchar(30) NOT NULL,
  status varchar(20) NOT NULL,
  components jsonb NOT NULL,
  purpose varchar(50),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_wa_template_category CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  CONSTRAINT chk_wa_template_status CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED')),
  CONSTRAINT chk_wa_template_purpose CHECK (purpose IS NULL OR purpose IN ('welcome', 'lead_capture', 'quote_send', 'order_status', 'follow_up'))
);

CREATE INDEX idx_whatsapp_templates_org ON whatsapp_templates(organization_id);
CREATE INDEX idx_whatsapp_templates_account ON whatsapp_templates(whatsapp_account_id);

COMMENT ON TABLE whatsapp_templates IS 'Meta-approved WhatsApp message templates';

-- Table: whatsapp_conversations
-- WhatsApp conversation threads
CREATE TABLE whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  whatsapp_account_id uuid NOT NULL REFERENCES whatsapp_accounts(id),
  wa_conversation_id varchar(100),
  customer_phone varchar(20) NOT NULL,
  customer_name varchar(255),
  customer_id uuid REFERENCES customers(id),
  lead_id uuid REFERENCES leads(id),
  assigned_agent_id uuid REFERENCES profiles(id),
  status varchar(20) NOT NULL DEFAULT 'active',
  conversation_type varchar(20) NOT NULL DEFAULT 'bot',
  intent varchar(50),
  last_message_at timestamptz,
  closed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_wa_conv_status CHECK (status IN ('active', 'closed', 'bot', 'human_takeover')),
  CONSTRAINT chk_wa_conv_type CHECK (conversation_type IN ('bot', 'human', 'mixed')),
  CONSTRAINT chk_wa_conv_intent CHECK (intent IS NULL OR intent IN ('quote_request', 'order_status', 'advisory', 'other'))
);

CREATE INDEX idx_wa_conversations_org ON whatsapp_conversations(organization_id);
CREATE INDEX idx_wa_conversations_phone ON whatsapp_conversations(organization_id, customer_phone);
CREATE INDEX idx_wa_conversations_status ON whatsapp_conversations(organization_id, status) WHERE status = 'active';
CREATE INDEX idx_wa_conversations_agent ON whatsapp_conversations(assigned_agent_id);

COMMENT ON TABLE whatsapp_conversations IS 'WhatsApp conversation threads with bot/human handoff';

-- Table: whatsapp_messages
-- Individual messages in conversations
CREATE TABLE whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  conversation_id uuid NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  wa_message_id varchar(100),
  direction varchar(10) NOT NULL,
  sender_type varchar(10) NOT NULL,
  sender_id uuid REFERENCES profiles(id),
  message_type varchar(20) NOT NULL DEFAULT 'text',
  content text,
  media_url text,
  template_name varchar(100),
  template_params jsonb,
  status varchar(20) NOT NULL DEFAULT 'sent',
  error_code varchar(20),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_wa_msg_direction CHECK (direction IN ('inbound', 'outbound')),
  CONSTRAINT chk_wa_msg_sender_type CHECK (sender_type IN ('customer', 'bot', 'agent')),
  CONSTRAINT chk_wa_msg_type CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'template', 'interactive', 'location')),
  CONSTRAINT chk_wa_msg_status CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
);

CREATE INDEX idx_wa_messages_conversation ON whatsapp_messages(conversation_id, created_at DESC);
CREATE INDEX idx_wa_messages_org ON whatsapp_messages(organization_id, created_at DESC);
CREATE INDEX idx_wa_messages_wa_id ON whatsapp_messages(wa_message_id) WHERE wa_message_id IS NOT NULL;

COMMENT ON TABLE whatsapp_messages IS 'Individual WhatsApp messages with delivery tracking';

-- ============================================================================
-- DOMAIN 11: NOTIFICATIONS AND COMMUNICATION (3 tables)
-- ============================================================================

-- Table: notifications
-- Internal system notifications (bell icon)
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  action_url text,
  entity_type varchar(50),
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  priority varchar(10) NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_notification_type CHECK (type IN ('lead_assigned', 'quote_approval', 'order_created', 'mention', 'alert', 'system')),
  CONSTRAINT chk_notification_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);

COMMENT ON TABLE notifications IS 'Internal system notifications with read/unread tracking';

-- Table: comments
-- Comments with @mentions and threading
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  mentions uuid[],
  parent_id uuid REFERENCES comments(id),
  is_internal boolean NOT NULL DEFAULT true,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_comment_entity_type CHECK (entity_type IN ('lead', 'quote', 'order', 'purchase_order', 'shipment'))
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_org ON comments(organization_id);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentions);

COMMENT ON TABLE comments IS 'Comments with @mention support and threading';

-- Table: email_logs
-- Email delivery tracking via SendGrid
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  to_email varchar(255) NOT NULL,
  to_name varchar(255),
  from_email varchar(255) NOT NULL,
  subject varchar(500) NOT NULL,
  template_id varchar(100),
  entity_type varchar(50),
  entity_id uuid,
  status varchar(20) NOT NULL DEFAULT 'queued',
  sendgrid_message_id varchar(100),
  error_message text,
  metadata jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_email_status CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'bounced', 'failed')),
  CONSTRAINT chk_email_entity_type CHECK (entity_type IS NULL OR entity_type IN ('quote', 'proforma', 'order', 'notification'))
);

CREATE INDEX idx_email_logs_org ON email_logs(organization_id, created_at DESC);
CREATE INDEX idx_email_logs_entity ON email_logs(entity_type, entity_id);
CREATE INDEX idx_email_logs_status ON email_logs(organization_id, status);

COMMENT ON TABLE email_logs IS 'Email delivery tracking via SendGrid';

-- ============================================================================
-- DOMAIN 12: AUDIT AND CONFIGURATION (4 tables)
-- ============================================================================

-- Table: audit_logs
-- Complete audit trail for all system actions
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action varchar(50) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  changes jsonb,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_audit_action CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'assign', 'login', 'export'))
);

CREATE INDEX idx_audit_logs_org_date ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(organization_id, action);

COMMENT ON TABLE audit_logs IS 'Complete audit trail. Consider monthly partitioning for high volume.';

-- Table: rejection_reasons
-- Configurable rejection reason catalog
CREATE TABLE rejection_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  entity_type varchar(50) NOT NULL,
  label varchar(255) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_rejection_entity_type CHECK (entity_type IN ('lead', 'quote', 'order'))
);

CREATE INDEX idx_rejection_reasons_org_entity ON rejection_reasons(organization_id, entity_type) WHERE is_active = true;

COMMENT ON TABLE rejection_reasons IS 'Configurable rejection reasons for leads, quotes, and orders';

-- Table: consecutive_counters
-- Thread-safe consecutive number generators
CREATE TABLE consecutive_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  entity_type varchar(50) NOT NULL,
  prefix varchar(10),
  current_value integer NOT NULL,
  start_value integer NOT NULL,
  increment integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_consecutive_entity_type CHECK (entity_type IN ('lead', 'quote', 'order', 'purchase_order', 'shipment', 'invoice'))
);

CREATE UNIQUE INDEX idx_consecutive_org_entity ON consecutive_counters(organization_id, entity_type);

COMMENT ON TABLE consecutive_counters IS 'Thread-safe consecutive counters. Use get_next_consecutive() function.';

-- Table: system_settings
-- Organization-specific system configuration
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  key varchar(100) NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_system_settings_org_key ON system_settings(organization_id, key);

COMMENT ON TABLE system_settings IS 'Organization-specific configuration (TRM auto-fetch, lead auto-assign, etc.)';

-- ============================================================================
-- DOMAIN 13: PRODUCT TRACEABILITY (1 table)
-- ============================================================================

-- Table: product_route_events
-- Product journey from PO to customer delivery
CREATE TABLE product_route_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  order_item_id uuid NOT NULL REFERENCES order_items(id),
  event_type varchar(30) NOT NULL,
  event_date timestamptz NOT NULL DEFAULT now(),
  location varchar(255),
  quantity numeric(10,2),
  performed_by uuid REFERENCES auth.users(id),
  reference_type varchar(50),
  reference_id uuid,
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_event_type CHECK (event_type IN ('po_created', 'po_confirmed', 'received_warehouse', 'quality_check', 'dispatched', 'in_transit', 'delivered', 'license_activated', 'returned')),
  CONSTRAINT chk_reference_type CHECK (reference_type IS NULL OR reference_type IN ('purchase_order', 'shipment', 'license_record'))
);

CREATE INDEX idx_product_route_order_item ON product_route_events(order_item_id, event_date);
CREATE INDEX idx_product_route_order ON product_route_events(order_id, event_date);
CREATE INDEX idx_product_route_org ON product_route_events(organization_id, event_date DESC);

COMMENT ON TABLE product_route_events IS 'Complete product journey tracking from purchase to delivery';

-- ============================================================================
-- DOMAIN 14: REPORTS AND DASHBOARD (2 tables)
-- ============================================================================

-- Table: dashboard_widgets
-- User-configurable dashboard widgets
CREATE TABLE dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  widget_type varchar(50) NOT NULL,
  position integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}',
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_widget_type CHECK (widget_type IN ('leads_funnel', 'quotes_pipeline', 'orders_status', 'revenue_chart', 'team_performance', 'pending_tasks'))
);

CREATE INDEX idx_dashboard_widgets_user ON dashboard_widgets(user_id, position);

COMMENT ON TABLE dashboard_widgets IS 'User-customizable dashboard widget configuration';

-- Table: saved_reports
-- User-saved report configurations
CREATE TABLE saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  name varchar(255) NOT NULL,
  report_type varchar(50) NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  columns jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_report_type CHECK (report_type IN ('leads', 'quotes', 'orders', 'revenue', 'performance', 'custom'))
);

CREATE INDEX idx_saved_reports_user ON saved_reports(user_id);
CREATE INDEX idx_saved_reports_org_shared ON saved_reports(organization_id) WHERE is_shared = true;

COMMENT ON TABLE saved_reports IS 'User-saved report configurations with sharing capability';

-- ============================================================================
-- FOREIGN KEY ADDITIONS (deferred references)
-- ============================================================================

-- Add FK from leads to rejection_reasons (circular dependency)
ALTER TABLE leads ADD CONSTRAINT fk_leads_rejection_reason
  FOREIGN KEY (rejection_reason_id) REFERENCES rejection_reasons(id);

-- Add FK from leads to whatsapp_conversations (circular dependency)
ALTER TABLE leads ADD CONSTRAINT fk_leads_source_conversation
  FOREIGN KEY (source_conversation_id) REFERENCES whatsapp_conversations(id);

-- Add FK from quotes to customer_contacts (circular dependency)
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_contact
  FOREIGN KEY (contact_id) REFERENCES customer_contacts(id);

-- Add FK from quote_items to quote_items (circular dependency for quote_item_id)
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_quote_item
  FOREIGN KEY (quote_item_id) REFERENCES quote_items(id);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function: set_updated_at
-- Updates the updated_at timestamp on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_updated_at IS 'Automatically updates updated_at column on row update';

-- Function: audit_trail_trigger (stub for future implementation)
-- Will log changes to audit_logs table
CREATE OR REPLACE FUNCTION audit_trail_trigger()
RETURNS trigger AS $$
BEGIN
  -- TODO: Implementation will be added in TAREA 0.4 (Audit Trail)
  -- This function will capture OLD and NEW values and insert into audit_logs
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_trail_trigger IS 'Audit trail trigger (stub for future implementation)';

-- ============================================================================
-- APPLY TRIGGERS TO ALL TABLES WITH updated_at
-- ============================================================================

-- Domain 1: Organizations and Users
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 2: Customers and Leads
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_customer_contacts_updated_at BEFORE UPDATE ON customer_contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 3: Products
CREATE TRIGGER trg_product_categories_updated_at BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_margin_rules_updated_at BEFORE UPDATE ON margin_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 4: Quotes
CREATE TRIGGER trg_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_quote_items_updated_at BEFORE UPDATE ON quote_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 5: Orders
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_order_pending_tasks_updated_at BEFORE UPDATE ON order_pending_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 6: Suppliers and Purchase Orders
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 7: Shipments
CREATE TRIGGER trg_shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 8: Invoices
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 9: Licenses
CREATE TRIGGER trg_license_records_updated_at BEFORE UPDATE ON license_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 10: WhatsApp
CREATE TRIGGER trg_whatsapp_accounts_updated_at BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_whatsapp_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 11: Communication
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 12: Configuration
CREATE TRIGGER trg_consecutive_counters_updated_at BEFORE UPDATE ON consecutive_counters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Domain 14: Dashboard
CREATE TRIGGER trg_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_saved_reports_updated_at BEFORE UPDATE ON saved_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- SUMMARY COMMENT
-- ============================================================================

COMMENT ON SCHEMA public IS
'Pscomercial-pro Business Schema - 45 tables across 14 domains
Migration: 20260212000001_business_schema.sql

DOMAINS:
1. Organizations & Users (6): organizations, profiles, roles, permissions, role_permissions, user_roles
2. Customers & Leads (4): customers, customer_contacts, leads, lead_assignments_log
3. Products (4): product_categories, products, margin_rules, trm_rates
4. Quotes (4): quotes, quote_items, quote_approvals, quote_follow_ups
5. Orders (5): orders, order_items, order_status_history, order_documents, order_pending_tasks
6. Suppliers (3): suppliers, purchase_orders, purchase_order_items
7. Logistics (2): shipments, shipment_items
8. Invoicing (2): invoices, invoice_items
9. Licenses (1): license_records
10. WhatsApp (4): whatsapp_accounts, whatsapp_templates, whatsapp_conversations, whatsapp_messages
11. Communication (3): notifications, comments, email_logs
12. Configuration (4): audit_logs, rejection_reasons, consecutive_counters, system_settings
13. Traceability (1): product_route_events
14. Reports (2): dashboard_widgets, saved_reports

PRINCIPLES:
- Multi-tenant with organization_id in all business tables
- UUID PKs with gen_random_uuid()
- timestamptz for all timestamps
- created_at and updated_at on all tables
- Soft delete with deleted_at where applicable
- Audit trail via triggers (to be implemented)
- Thread-safe consecutives with SELECT FOR UPDATE
- RLS policies to be added in TAREA 0.3
';
