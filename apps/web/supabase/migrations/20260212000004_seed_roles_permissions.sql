-- =====================================================================================
-- Migration: Seed Roles and Permissions
-- Description: Insert all system permissions, 12 default roles, and role-permission mappings
-- Author: System
-- Date: 2026-02-12
-- Reference: FASE-02-Arquitectura-RBAC.md
-- =====================================================================================

-- =====================================================================================
-- STEP 1: Create Demo Organization (for system roles template)
-- =====================================================================================
INSERT INTO organizations (id, name, nit, domain, plan, settings, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PROSUMINISTROS S.A.S.',
  '900123456-7',
  'prosuministros.com',
  'enterprise',
  '{"currency": "COP", "timezone": "America/Bogota", "language": "es"}'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================================
-- STEP 2: Insert ~65 System Permissions (Grouped by Module)
-- =====================================================================================

-- Dashboard Module (2 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('dashboard:read', 'dashboard', 'read', 'Ver dashboard y métricas'),
('dashboard:export', 'dashboard', 'export', 'Exportar datos del dashboard');

-- Leads Module (7 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('leads:create', 'leads', 'create', 'Crear leads manualmente'),
('leads:read', 'leads', 'read', 'Ver leads'),
('leads:update', 'leads', 'update', 'Editar leads'),
('leads:delete', 'leads', 'delete', 'Eliminar leads'),
('leads:assign', 'leads', 'assign', 'Asignar leads a asesores'),
('leads:reassign', 'leads', 'reassign', 'Reasignar leads entre asesores'),
('leads:export', 'leads', 'export', 'Exportar listado de leads');

-- Customers Module (5 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('customers:create', 'customers', 'create', 'Crear clientes'),
('customers:read', 'customers', 'read', 'Ver clientes'),
('customers:update', 'customers', 'update', 'Editar clientes'),
('customers:delete', 'customers', 'delete', 'Eliminar clientes'),
('customers:export', 'customers', 'export', 'Exportar clientes');

-- Products Module (5 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('products:create', 'products', 'create', 'Crear productos'),
('products:read', 'products', 'read', 'Ver catálogo de productos'),
('products:update', 'products', 'update', 'Editar productos'),
('products:delete', 'products', 'delete', 'Eliminar productos'),
('products:export', 'products', 'export', 'Exportar productos');

-- Quotes Module (7 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('quotes:create', 'quotes', 'create', 'Crear cotizaciones'),
('quotes:read', 'quotes', 'read', 'Ver cotizaciones'),
('quotes:update', 'quotes', 'update', 'Editar cotizaciones'),
('quotes:delete', 'quotes', 'delete', 'Eliminar cotizaciones'),
('quotes:approve', 'quotes', 'approve', 'Aprobar cotizaciones con margen bajo'),
('quotes:send', 'quotes', 'send', 'Enviar cotización/proforma al cliente'),
('quotes:export', 'quotes', 'export', 'Exportar cotizaciones');

-- Orders Module (5 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('orders:create', 'orders', 'create', 'Crear pedidos'),
('orders:read', 'orders', 'read', 'Ver pedidos'),
('orders:update', 'orders', 'update', 'Editar pedidos'),
('orders:delete', 'orders', 'delete', 'Eliminar/cancelar pedidos'),
('orders:export', 'orders', 'export', 'Exportar pedidos');

-- Purchase Orders Module (6 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('purchase_orders:create', 'purchase_orders', 'create', 'Crear órdenes de compra'),
('purchase_orders:read', 'purchase_orders', 'read', 'Ver órdenes de compra'),
('purchase_orders:update', 'purchase_orders', 'update', 'Editar órdenes de compra'),
('purchase_orders:delete', 'purchase_orders', 'delete', 'Eliminar órdenes de compra'),
('purchase_orders:approve', 'purchase_orders', 'approve', 'Aprobar órdenes de compra'),
('purchase_orders:export', 'purchase_orders', 'export', 'Exportar órdenes de compra');

-- Logistics Module (4 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('logistics:create', 'logistics', 'create', 'Crear despachos'),
('logistics:read', 'logistics', 'read', 'Ver despachos y seguimiento'),
('logistics:update', 'logistics', 'update', 'Editar despachos'),
('logistics:export', 'logistics', 'export', 'Exportar logística');

-- Billing Module (4 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('billing:create', 'billing', 'create', 'Registrar facturas'),
('billing:read', 'billing', 'read', 'Ver facturas'),
('billing:update', 'billing', 'update', 'Editar facturas'),
('billing:export', 'billing', 'export', 'Exportar facturación');

-- Licenses Module (4 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('licenses:create', 'licenses', 'create', 'Registrar licencias'),
('licenses:read', 'licenses', 'read', 'Ver licencias'),
('licenses:update', 'licenses', 'update', 'Editar licencias'),
('licenses:export', 'licenses', 'export', 'Exportar licencias');

-- WhatsApp Module (4 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('whatsapp:read', 'whatsapp', 'read', 'Ver conversaciones de WhatsApp'),
('whatsapp:send', 'whatsapp', 'send', 'Enviar mensajes por WhatsApp'),
('whatsapp:configure', 'whatsapp', 'configure', 'Configurar cuenta y templates de WhatsApp'),
('whatsapp:export', 'whatsapp', 'export', 'Exportar conversaciones');

-- Reports Module (3 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('reports:read', 'reports', 'read', 'Ver reportes'),
('reports:create', 'reports', 'create', 'Crear reportes personalizados'),
('reports:export', 'reports', 'export', 'Exportar reportes');

-- Admin Module (5 permissions)
INSERT INTO permissions (slug, module, action, description) VALUES
('admin:read', 'admin', 'read', 'Ver panel de administración'),
('admin:manage_roles', 'admin', 'manage_roles', 'Crear/editar/eliminar roles'),
('admin:manage_users', 'admin', 'manage_users', 'Crear/editar/desactivar usuarios'),
('admin:manage_settings', 'admin', 'manage_settings', 'Editar configuraciones del sistema'),
('admin:view_audit', 'admin', 'view_audit', 'Ver bitácora de auditoría');

-- =====================================================================================
-- STEP 3: Insert 12 System Roles (using demo organization)
-- =====================================================================================

INSERT INTO roles (organization_id, name, slug, description, is_system, is_active) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Super Administrador',
  'super_admin',
  'Acceso total al sistema. Gestión de la organización.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Gerente General',
  'gerente_general',
  'Visibilidad total. Aprobaciones. Dashboard ejecutivo.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Director Comercial',
  'director_comercial',
  'Gestión del equipo comercial. KPIs. Creación de leads.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Gerente Comercial',
  'gerente_comercial',
  'Aprobación de márgenes. Asignación de leads. Reportes.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Gerente Operativo',
  'gerente_operativo',
  'Supervisión de pedidos, logística, bodega. Semáforo operativo.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Asesor Comercial',
  'asesor_comercial',
  'Gestión de leads asignados. Cotizaciones. Pedidos.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Finanzas',
  'finanzas',
  'Control financiero. Validación de crédito. Facturación.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Compras',
  'compras',
  'Órdenes de compra. Gestión de proveedores.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Logística',
  'logistica',
  'Despachos. Seguimiento. Guías de transporte.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Jefe de Bodega',
  'jefe_bodega',
  'Recepción de mercancía. Control de inventario.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Auxiliar de Bodega',
  'auxiliar_bodega',
  'Recepción y despacho bajo supervisión.',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Facturación',
  'facturacion',
  'Registro y seguimiento de facturas.',
  true,
  true
);

-- =====================================================================================
-- STEP 4: Map Role-Permission Relationships
-- =====================================================================================

-- Helper: Get role_id and permission_id from slugs
DO $$
DECLARE
  v_super_admin_id uuid;
  v_gerente_general_id uuid;
  v_director_comercial_id uuid;
  v_gerente_comercial_id uuid;
  v_gerente_operativo_id uuid;
  v_asesor_comercial_id uuid;
  v_finanzas_id uuid;
  v_compras_id uuid;
  v_logistica_id uuid;
  v_jefe_bodega_id uuid;
  v_auxiliar_bodega_id uuid;
  v_facturacion_id uuid;
BEGIN
  -- Get all role IDs
  SELECT id INTO v_super_admin_id FROM roles WHERE slug = 'super_admin' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_gerente_general_id FROM roles WHERE slug = 'gerente_general' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_director_comercial_id FROM roles WHERE slug = 'director_comercial' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_gerente_comercial_id FROM roles WHERE slug = 'gerente_comercial' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_gerente_operativo_id FROM roles WHERE slug = 'gerente_operativo' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_asesor_comercial_id FROM roles WHERE slug = 'asesor_comercial' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_finanzas_id FROM roles WHERE slug = 'finanzas' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_compras_id FROM roles WHERE slug = 'compras' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_logistica_id FROM roles WHERE slug = 'logistica' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_jefe_bodega_id FROM roles WHERE slug = 'jefe_bodega' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_auxiliar_bodega_id FROM roles WHERE slug = 'auxiliar_bodega' AND organization_id = '00000000-0000-0000-0000-000000000001';
  SELECT id INTO v_facturacion_id FROM roles WHERE slug = 'facturacion' AND organization_id = '00000000-0000-0000-0000-000000000001';

  -- =====================================================================================
  -- SUPER ADMIN: ALL permissions (65 total)
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_super_admin_id, id FROM permissions;

  -- =====================================================================================
  -- GERENTE GENERAL: ALL permissions (65 total) - except manage_settings
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_gerente_general_id, id FROM permissions
  WHERE slug != 'admin:manage_settings';

  -- =====================================================================================
  -- DIRECTOR COMERCIAL: Commercial modules + reports + dashboard
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_director_comercial_id, id FROM permissions WHERE slug IN (
    -- Dashboard
    'dashboard:read', 'dashboard:export',
    -- Leads (all except delete)
    'leads:create', 'leads:read', 'leads:update', 'leads:assign', 'leads:reassign', 'leads:export',
    -- Customers (all except delete)
    'customers:create', 'customers:read', 'customers:update', 'customers:export',
    -- Products (create, read, update, export)
    'products:create', 'products:read', 'products:update', 'products:export',
    -- Quotes (all except delete)
    'quotes:create', 'quotes:read', 'quotes:update', 'quotes:approve', 'quotes:send', 'quotes:export',
    -- Orders (all except delete)
    'orders:create', 'orders:read', 'orders:update', 'orders:export',
    -- Purchase Orders (read only)
    'purchase_orders:read',
    -- Logistics (read only)
    'logistics:read',
    -- Billing (read only)
    'billing:read',
    -- Licenses (read only)
    'licenses:read',
    -- WhatsApp
    'whatsapp:read', 'whatsapp:send', 'whatsapp:export',
    -- Reports
    'reports:read', 'reports:create', 'reports:export',
    -- Admin (read only)
    'admin:read'
  );

  -- =====================================================================================
  -- GERENTE COMERCIAL: Commercial operations + team management
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_gerente_comercial_id, id FROM permissions WHERE slug IN (
    -- Dashboard
    'dashboard:read', 'dashboard:export',
    -- Leads (read, update, assign, reassign, export)
    'leads:read', 'leads:update', 'leads:assign', 'leads:reassign', 'leads:export',
    -- Customers (create, read, update, export)
    'customers:create', 'customers:read', 'customers:update', 'customers:export',
    -- Products (read only)
    'products:read',
    -- Quotes (create, read, update, approve, send, export)
    'quotes:create', 'quotes:read', 'quotes:update', 'quotes:approve', 'quotes:send', 'quotes:export',
    -- Orders (create, read, update, export)
    'orders:create', 'orders:read', 'orders:update', 'orders:export',
    -- Purchase Orders (read only)
    'purchase_orders:read',
    -- Logistics (read only)
    'logistics:read',
    -- Billing (read only)
    'billing:read',
    -- Licenses (read only)
    'licenses:read',
    -- WhatsApp
    'whatsapp:read', 'whatsapp:send', 'whatsapp:export',
    -- Reports
    'reports:read', 'reports:create', 'reports:export'
  );

  -- =====================================================================================
  -- GERENTE OPERATIVO: Operations oversight (orders, POs, logistics, billing)
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_gerente_operativo_id, id FROM permissions WHERE slug IN (
    -- Dashboard
    'dashboard:read', 'dashboard:export',
    -- Customers (read only)
    'customers:read',
    -- Products (read only)
    'products:read',
    -- Orders (create, read, update, export)
    'orders:create', 'orders:read', 'orders:update', 'orders:export',
    -- Purchase Orders (all)
    'purchase_orders:create', 'purchase_orders:read', 'purchase_orders:update',
    'purchase_orders:approve', 'purchase_orders:export',
    -- Logistics (all)
    'logistics:create', 'logistics:read', 'logistics:update', 'logistics:export',
    -- Billing (read only)
    'billing:read',
    -- Licenses (all)
    'licenses:create', 'licenses:read', 'licenses:update', 'licenses:export',
    -- Reports
    'reports:read', 'reports:create', 'reports:export'
  );

  -- =====================================================================================
  -- ASESOR COMERCIAL: Own leads, quotes, orders (limited scope)
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_asesor_comercial_id, id FROM permissions WHERE slug IN (
    -- Dashboard (read only)
    'dashboard:read',
    -- Leads (read, update - own only)
    'leads:read', 'leads:update',
    -- Customers (create, read, update)
    'customers:create', 'customers:read', 'customers:update',
    -- Products (read only)
    'products:read',
    -- Quotes (create, read, update, send - own only)
    'quotes:create', 'quotes:read', 'quotes:update', 'quotes:send',
    -- Orders (create, read, update - own only)
    'orders:create', 'orders:read', 'orders:update',
    -- Logistics (read - own orders only)
    'logistics:read',
    -- Billing (read - own customers only)
    'billing:read',
    -- Licenses (read only)
    'licenses:read',
    -- WhatsApp
    'whatsapp:read', 'whatsapp:send',
    -- Reports (read only)
    'reports:read'
  );

  -- =====================================================================================
  -- FINANZAS: Financial control (billing, credit validation, quotes approval)
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_finanzas_id, id FROM permissions WHERE slug IN (
    -- Dashboard
    'dashboard:read', 'dashboard:export',
    -- Customers (create, read, update, export)
    'customers:create', 'customers:read', 'customers:update', 'customers:export',
    -- Products (read only)
    'products:read',
    -- Quotes (read, export - for margin approval)
    'quotes:read', 'quotes:export',
    -- Orders (read, export)
    'orders:read', 'orders:export',
    -- Purchase Orders (read, approve, export)
    'purchase_orders:read', 'purchase_orders:approve', 'purchase_orders:export',
    -- Billing (all)
    'billing:create', 'billing:read', 'billing:update', 'billing:export',
    -- Reports
    'reports:read', 'reports:create', 'reports:export'
  );

  -- =====================================================================================
  -- COMPRAS: Purchase orders and supplier management
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_compras_id, id FROM permissions WHERE slug IN (
    -- Dashboard (read only)
    'dashboard:read',
    -- Customers (read only)
    'customers:read',
    -- Products (create, read, update, export)
    'products:create', 'products:read', 'products:update', 'products:export',
    -- Orders (read only)
    'orders:read', 'orders:export',
    -- Purchase Orders (all)
    'purchase_orders:create', 'purchase_orders:read', 'purchase_orders:update', 'purchase_orders:export',
    -- Logistics (read only)
    'logistics:read',
    -- Licenses (create, read, update, export)
    'licenses:create', 'licenses:read', 'licenses:update', 'licenses:export',
    -- Reports (read, export)
    'reports:read', 'reports:export'
  );

  -- =====================================================================================
  -- LOGISTICA: Dispatch and tracking
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_logistica_id, id FROM permissions WHERE slug IN (
    -- Dashboard (read only)
    'dashboard:read',
    -- Customers (read only)
    'customers:read',
    -- Orders (read only)
    'orders:read',
    -- Purchase Orders (read only)
    'purchase_orders:read',
    -- Logistics (all)
    'logistics:create', 'logistics:read', 'logistics:update', 'logistics:export',
    -- Reports (read, export)
    'reports:read', 'reports:export'
  );

  -- =====================================================================================
  -- JEFE BODEGA: Warehouse reception and inventory control
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_jefe_bodega_id, id FROM permissions WHERE slug IN (
    -- Customers (read only)
    'customers:read',
    -- Products (read only)
    'products:read',
    -- Orders (read only)
    'orders:read',
    -- Purchase Orders (read, update)
    'purchase_orders:read', 'purchase_orders:update',
    -- Logistics (create, read, update)
    'logistics:create', 'logistics:read', 'logistics:update',
    -- Reports (read only)
    'reports:read'
  );

  -- =====================================================================================
  -- AUXILIAR BODEGA: Reception and dispatch under supervision
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_auxiliar_bodega_id, id FROM permissions WHERE slug IN (
    -- Orders (read only)
    'orders:read',
    -- Logistics (create, read, update)
    'logistics:create', 'logistics:read', 'logistics:update'
  );

  -- =====================================================================================
  -- FACTURACION: Invoice registration and tracking
  -- =====================================================================================
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_facturacion_id, id FROM permissions WHERE slug IN (
    -- Dashboard (read only)
    'dashboard:read',
    -- Customers (read only)
    'customers:read',
    -- Orders (read, export)
    'orders:read', 'orders:export',
    -- Billing (all)
    'billing:create', 'billing:read', 'billing:update', 'billing:export',
    -- Reports (read, export)
    'reports:read', 'reports:export'
  );

END $$;

-- =====================================================================================
-- VERIFICATION: Count permissions by role
-- =====================================================================================
-- Uncomment to verify counts after migration:
/*
SELECT
  r.name,
  r.slug,
  COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
WHERE r.organization_id = '00000000-0000-0000-0000-000000000001'
GROUP BY r.id, r.name, r.slug
ORDER BY permission_count DESC;
*/

-- =====================================================================================
-- Expected Permission Counts:
-- - super_admin: 65
-- - gerente_general: 64 (all except admin:manage_settings)
-- - director_comercial: ~42
-- - gerente_comercial: ~35
-- - gerente_operativo: ~28
-- - asesor_comercial: ~18
-- - finanzas: ~22
-- - compras: ~18
-- - logistica: ~9
-- - jefe_bodega: ~10
-- - auxiliar_bodega: ~3
-- - facturacion: ~9
-- =====================================================================================
