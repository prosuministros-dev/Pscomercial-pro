-- ============================================================================
-- PSCOMERCIAL-PRO - BUSINESS FUNCTIONS MIGRATION
-- Migration: 20260212000005_business_functions.sql
-- Date: 2026-02-12
-- Description: Critical SQL functions per FASE-01 and FASE-06
-- Items: #1 get_next_consecutive, #2 set_created_by, #3 audit_trail_trigger,
--        #5 seed_organization_roles, #6-7 get_leads_for_user (data scope)
-- ============================================================================

-- ============================================================================
-- #1 CRITICO: get_next_consecutive(org_id, entity_type)
-- Thread-safe consecutive number generator using UPDATE ... RETURNING
-- Reference: FASE-01 Section 6.1, FASE-06 Function #1
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_consecutive(
  p_org_id uuid,
  p_entity_type text
)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
  v_prefix varchar(10);
BEGIN
  -- Atomic UPDATE with implicit row lock (no explicit SELECT FOR UPDATE needed)
  UPDATE consecutive_counters
  SET current_value = current_value + increment,
      updated_at = now()
  WHERE organization_id = p_org_id
    AND entity_type = p_entity_type
  RETURNING current_value, prefix INTO v_next, v_prefix;

  IF v_next IS NULL THEN
    RAISE EXCEPTION 'Consecutive counter not found for org % entity %', p_org_id, p_entity_type
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Return formatted: prefix + number (e.g., 'OC-1' or just '30001')
  RETURN COALESCE(v_prefix, '') || v_next::text;
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_consecutive(uuid, text) TO authenticated;

COMMENT ON FUNCTION get_next_consecutive(uuid, text) IS
'Thread-safe consecutive number generator. Uses atomic UPDATE...RETURNING to avoid race conditions. Returns formatted string with optional prefix (e.g., OC-1, DSP-1, 30001).';


-- ============================================================================
-- #2 MEDIO: set_created_by() trigger function
-- Automatically sets created_by to auth.uid() on INSERT
-- Reference: FASE-06
-- ============================================================================

CREATE OR REPLACE FUNCTION set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set if not already provided (allows API to set explicitly)
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_created_by IS
'Automatically sets created_by to the authenticated user ID on INSERT. Only sets if not already provided.';


-- Apply set_created_by trigger to all tables with created_by column
-- Domain 1: Roles
CREATE TRIGGER trg_roles_set_created_by BEFORE INSERT ON roles
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 2: Customers and Leads
CREATE TRIGGER trg_customers_set_created_by BEFORE INSERT ON customers
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER trg_customer_contacts_set_created_by BEFORE INSERT ON customer_contacts
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER trg_leads_set_created_by BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 3: Products
CREATE TRIGGER trg_products_set_created_by BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER trg_margin_rules_set_created_by BEFORE INSERT ON margin_rules
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 4: Quotes
CREATE TRIGGER trg_quotes_set_created_by BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER trg_quote_items_set_created_by BEFORE INSERT ON quote_items
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 5: Orders
CREATE TRIGGER trg_orders_set_created_by BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER trg_order_items_set_created_by BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 6: Suppliers and Purchase Orders
CREATE TRIGGER trg_suppliers_set_created_by BEFORE INSERT ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER trg_purchase_orders_set_created_by BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 7: Shipments
CREATE TRIGGER trg_shipments_set_created_by BEFORE INSERT ON shipments
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 8: Invoices
CREATE TRIGGER trg_invoices_set_created_by BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 9: Licenses
CREATE TRIGGER trg_license_records_set_created_by BEFORE INSERT ON license_records
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Domain 10: WhatsApp
CREATE TRIGGER trg_whatsapp_templates_set_created_by BEFORE INSERT ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION set_created_by();


-- ============================================================================
-- #3 ALTO: audit_trail_trigger() - Full implementation
-- Replaces the stub from 20260212000001_business_schema.sql
-- Captures INSERT/UPDATE/DELETE operations into audit_logs
-- Reference: FASE-01, FASE-06
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trail_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_action text;
  v_changes jsonb;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Get the current authenticated user
  v_user_id := auth.uid();

  -- Determine the action
  v_action := LOWER(TG_OP);

  -- Build change data
  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_changes := jsonb_build_object('old', v_old_data);

    -- Extract organization_id from OLD record
    v_org_id := (v_old_data->>'organization_id')::uuid;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    v_changes := jsonb_build_object('new', v_new_data);

    -- Extract organization_id from NEW record
    v_org_id := (v_new_data->>'organization_id')::uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);

    -- Only store changed fields (exclude updated_at to reduce noise)
    v_changes := jsonb_build_object(
      'old', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(v_old_data)
        WHERE key != 'updated_at'
          AND value IS DISTINCT FROM (v_new_data->key)
      ),
      'new', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(v_new_data)
        WHERE key != 'updated_at'
          AND value IS DISTINCT FROM (v_old_data->key)
      )
    );

    -- Extract organization_id from NEW record
    v_org_id := (v_new_data->>'organization_id')::uuid;
  END IF;

  -- Skip if no actual changes on UPDATE (only updated_at changed)
  IF TG_OP = 'UPDATE' AND (v_changes->'old') IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert audit log (only if user is authenticated and org_id is available)
  IF v_user_id IS NOT NULL AND v_org_id IS NOT NULL THEN
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      changes,
      metadata
    ) VALUES (
      v_org_id,
      v_user_id,
      v_action,
      TG_TABLE_NAME,
      CASE
        WHEN TG_OP = 'DELETE' THEN (v_old_data->>'id')::uuid
        ELSE (v_new_data->>'id')::uuid
      END,
      v_changes,
      jsonb_build_object(
        'schema', TG_TABLE_SCHEMA,
        'trigger', TG_NAME
      )
    );
  END IF;

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION audit_trail_trigger IS
'Full audit trail trigger. Captures INSERT/UPDATE/DELETE into audit_logs with old/new values. Only stores changed fields on UPDATE. Skips if no user authenticated or no organization_id.';


-- ============================================================================
-- #5 ALTO: seed_organization_roles(p_org_id)
-- Creates the 12 system roles and all permissions for a new organization
-- Called when a new organization is created
-- Reference: FASE-02 Section 3
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_organization_roles(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_ids record;
  v_perm_record record;
BEGIN
  -- Verify organization exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization not found: %', p_org_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Skip if roles already exist for this org
  IF EXISTS (SELECT 1 FROM roles WHERE organization_id = p_org_id AND is_system = true LIMIT 1) THEN
    RAISE NOTICE 'Roles already seeded for organization %', p_org_id;
    RETURN;
  END IF;

  -- Create the 12 system roles
  INSERT INTO roles (organization_id, name, slug, description, is_system, is_active)
  VALUES
    (p_org_id, 'Super Admin', 'super_admin', 'Acceso total al sistema', true, true),
    (p_org_id, 'Gerente General', 'gerente_general', 'Dirección general de la empresa', true, true),
    (p_org_id, 'Director Comercial', 'director_comercial', 'Dirección del área comercial', true, true),
    (p_org_id, 'Gerente Comercial', 'gerente_comercial', 'Gestión de equipo comercial', true, true),
    (p_org_id, 'Gerente Operativo', 'gerente_operativo', 'Gestión de operaciones', true, true),
    (p_org_id, 'Asesor Comercial', 'asesor_comercial', 'Gestión de leads y cotizaciones', true, true),
    (p_org_id, 'Finanzas', 'finanzas', 'Gestión financiera y facturación', true, true),
    (p_org_id, 'Compras', 'compras', 'Gestión de compras y proveedores', true, true),
    (p_org_id, 'Logística', 'logistica', 'Gestión de despachos y entregas', true, true),
    (p_org_id, 'Jefe de Bodega', 'jefe_bodega', 'Supervisión de bodega y recepción', true, true),
    (p_org_id, 'Auxiliar de Bodega', 'auxiliar_bodega', 'Operaciones de bodega', true, true),
    (p_org_id, 'Facturación', 'facturacion', 'Emisión y gestión de facturas', true, true);

  -- Assign ALL permissions to super_admin role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'super_admin';

  -- Assign permissions to gerente_general (all except admin:manage_system)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'gerente_general'
    AND p.slug != 'admin:manage_settings';

  -- Assign permissions to director_comercial
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'director_comercial'
    AND p.module IN ('dashboard', 'leads', 'quotes', 'orders', 'customers', 'products', 'reports');

  -- Assign permissions to gerente_comercial
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'gerente_comercial'
    AND p.module IN ('dashboard', 'leads', 'quotes', 'orders', 'customers')
    AND p.action IN ('read', 'create', 'update', 'assign', 'reassign', 'approve', 'send', 'export');

  -- Assign permissions to asesor_comercial
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'asesor_comercial'
    AND p.module IN ('dashboard', 'leads', 'quotes', 'customers')
    AND p.action IN ('read', 'create', 'update', 'send');

  -- Assign permissions to gerente_operativo
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'gerente_operativo'
    AND p.module IN ('dashboard', 'orders', 'purchase_orders', 'logistics', 'licenses');

  -- Assign permissions to finanzas
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'finanzas'
    AND p.module IN ('dashboard', 'billing', 'orders', 'customers', 'purchase_orders', 'reports')
    AND p.action IN ('read', 'create', 'update', 'approve', 'export');

  -- Assign permissions to compras
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'compras'
    AND p.module IN ('dashboard', 'purchase_orders', 'products', 'orders', 'licenses')
    AND p.action IN ('read', 'create', 'update', 'export');

  -- Assign permissions to logistica
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'logistica'
    AND p.module IN ('dashboard', 'logistics', 'orders', 'purchase_orders')
    AND p.action IN ('read', 'create', 'update', 'export');

  -- Assign permissions to jefe_bodega
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'jefe_bodega'
    AND p.module IN ('customers', 'products', 'orders', 'purchase_orders', 'logistics', 'reports')
    AND p.action IN ('read', 'create', 'update');

  -- Assign permissions to auxiliar_bodega
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'auxiliar_bodega'
    AND p.module IN ('orders', 'logistics')
    AND p.action IN ('read', 'create', 'update');

  -- Assign permissions to facturacion
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.organization_id = p_org_id
    AND r.slug = 'facturacion'
    AND p.module IN ('dashboard', 'billing', 'orders', 'customers', 'reports')
    AND p.action IN ('read', 'create', 'update', 'export');

  -- Seed consecutive counters for this organization
  INSERT INTO consecutive_counters (organization_id, entity_type, prefix, current_value, start_value, increment)
  VALUES
    (p_org_id, 'lead', NULL, 100, 100, 1),
    (p_org_id, 'quote', NULL, 30000, 30000, 1),
    (p_org_id, 'order', NULL, 1, 1, 1),
    (p_org_id, 'purchase_order', 'OC-', 1, 1, 1),
    (p_org_id, 'shipment', 'DSP-', 1, 1, 1),
    (p_org_id, 'invoice', 'FAC-', 1, 1, 1)
  ON CONFLICT (organization_id, entity_type) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION seed_organization_roles(uuid) TO authenticated;

COMMENT ON FUNCTION seed_organization_roles(uuid) IS
'Seeds the 12 system roles with their permissions and consecutive counters for a new organization. Idempotent - skips if roles already exist.';


-- ============================================================================
-- #6-7 ALTO: get_leads_for_user() - Data scope-aware query
-- Filters leads based on user role (all/team/own/none)
-- Reference: FASE-02 Section 7.3
-- ============================================================================

CREATE OR REPLACE FUNCTION get_leads_for_user(
  p_user_id uuid,
  p_org_id uuid,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS SETOF leads
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_scope text;
  v_role text;
BEGIN
  -- Determine the data scope based on user's primary role
  v_role := get_user_primary_role(p_user_id);

  CASE v_role
    WHEN 'super_admin', 'gerente_general', 'director_comercial' THEN
      v_scope := 'all';
    WHEN 'gerente_comercial', 'gerente_operativo' THEN
      v_scope := 'team';
    WHEN 'asesor_comercial' THEN
      v_scope := 'own';
    ELSE
      v_scope := 'none';
  END CASE;

  -- Return nothing for 'none' scope
  IF v_scope = 'none' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT l.*
  FROM leads l
  WHERE l.organization_id = p_org_id
    AND l.deleted_at IS NULL
    AND (p_status IS NULL OR l.status = p_status)
    AND (
      v_scope = 'all'
      OR (v_scope = 'own' AND l.assigned_to = p_user_id)
      OR (v_scope = 'team' AND l.assigned_to IN (
        -- Team members: asesores in the same organization
        SELECT ur.user_id
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE r.slug = 'asesor_comercial'
          AND r.organization_id = p_org_id
      ))
    )
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_leads_for_user(uuid, uuid, text, integer, integer) TO authenticated;

COMMENT ON FUNCTION get_leads_for_user IS
'Returns leads filtered by user data scope. super_admin/gerente_general/director_comercial see all, gerente_comercial sees team, asesor_comercial sees own. Supports pagination and status filter.';


-- ============================================================================
-- End of Migration
-- ============================================================================
