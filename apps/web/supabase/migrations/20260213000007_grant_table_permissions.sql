-- ============================================================================
-- GRANT table permissions to authenticated and service_role
-- ============================================================================
-- The MakerKit initial migration (20241219010757) revokes all default
-- privileges from public schema. Our custom tables need explicit GRANTs
-- for the authenticated role to access them (even with RLS policies).
--
-- RLS policies handle tenant isolation (organization_id filtering).
-- GRANTs enable base table access for the authenticated role.
-- ============================================================================

-- Organizations & Users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organizations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.roles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.permissions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.role_permissions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated, service_role;

-- Customers & Leads
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customer_contacts TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.leads TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lead_assignments_log TO authenticated, service_role;

-- Products & Catalog
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_categories TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.margin_rules TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trm_rates TO authenticated, service_role;

-- Quotes
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quotes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_items TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_approvals TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_follow_ups TO authenticated, service_role;

-- Orders
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_status_history TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_documents TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_pending_tasks TO authenticated, service_role;

-- Suppliers & Purchase Orders
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.suppliers TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_orders TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_order_items TO authenticated, service_role;

-- Shipments
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shipments TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shipment_items TO authenticated, service_role;

-- Invoices
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invoices TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invoice_items TO authenticated, service_role;

-- Licenses
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.license_records TO authenticated, service_role;

-- WhatsApp
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_accounts TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_templates TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_conversations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.whatsapp_messages TO authenticated, service_role;

-- Notifications & Comments
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments TO authenticated, service_role;

-- Email, Audit & System
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.email_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rejection_reasons TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.consecutive_counters TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.system_settings TO authenticated, service_role;

-- Product Routes & Dashboards
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_route_events TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dashboard_widgets TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_reports TO authenticated, service_role;

-- Grant USAGE on all sequences (needed for INSERT with serial/identity columns)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
