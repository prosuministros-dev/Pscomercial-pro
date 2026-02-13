-- ============================================================================
-- PSCOMERCIAL-PRO - SEED DEMO DATA
-- Migration: 20260212000007_seed_demo_data.sql
-- Date: 2026-02-12
-- Description: Complete seed data for PROSUMINISTROS organization
-- Dependencies: 000001 (schema), 000004 (permissions/roles), 000005 (functions)
-- Covers: 0.7.1 → 0.7.10 (all Sprint 0.7 subtasks)
-- NOTE: Column names MUST match 20260212000001_business_schema.sql exactly
-- ============================================================================

-- Fixed UUID: Org = 00000000-0000-0000-0000-000000000001 (from migration 4)

-- ============================================================================
-- 0.7.6: Product Categories / Verticales (5 per spec)
-- Spec: Accesorios, Hardware, Otros, Servicios, Software
-- Columns: id, organization_id, name, slug, parent_id, level, is_active
-- ============================================================================

INSERT INTO product_categories (id, organization_id, name, slug, parent_id, level, is_active) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001',
   'Software', 'software', NULL, 0, true),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001',
   'Hardware', 'hardware', NULL, 0, true),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001',
   'Accesorios', 'accesorios', NULL, 0, true),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000001',
   'Servicios', 'servicios', NULL, 0, true),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000001',
   'Otros', 'otros', NULL, 0, true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 0.7.6: Products (12 demo products across 5 categories)
-- Columns: id, organization_id, sku, name, description, category_id, brand,
--   unit_cost_usd, unit_cost_cop, suggested_price_cop, currency,
--   is_service, is_license, requires_activation, warranty_months, is_active
-- ============================================================================

INSERT INTO products (id, organization_id, sku, name, description, category_id, brand,
  unit_cost_usd, unit_cost_cop, suggested_price_cop, currency,
  is_service, is_license, requires_activation, warranty_months, is_active) VALUES
  -- Software (category 1)
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000001',
   'MS365-BP', 'Microsoft 365 Business Premium', 'Suscripción anual por usuario',
   '00000000-0000-0000-0003-000000000001', 'Microsoft',
   20.50, 85000, 120000, 'COP', false, true, true, 12, true),

  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000001',
   'ADOBE-CC', 'Adobe Creative Cloud', 'Suscripción anual por usuario',
   '00000000-0000-0000-0003-000000000001', 'Adobe',
   43.50, 180000, 250000, 'COP', false, true, true, 12, true),

  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0000-000000000001',
   'ACAD-LT26', 'AutoCAD LT 2026', 'Licencia anual AutoCAD LT',
   '00000000-0000-0000-0003-000000000001', 'Autodesk',
   289.00, 1200000, 1680000, 'COP', false, true, true, 12, true),

  ('00000000-0000-0000-0004-000000000009', '00000000-0000-0000-0000-000000000001',
   'KAS-EPS', 'Kaspersky Endpoint Security', 'Business Select - 1 año por equipo',
   '00000000-0000-0000-0003-000000000001', 'Kaspersky',
   22.89, 95000, 140000, 'COP', false, true, true, 12, true),

  ('00000000-0000-0000-0004-000000000010', '00000000-0000-0000-0000-000000000001',
   'VEEAM-BE', 'Veeam Backup Enterprise', 'Backup & Replication por socket',
   '00000000-0000-0000-0003-000000000001', 'Veeam',
   1084.30, 4500000, 6200000, 'COP', false, true, true, 12, true),

  -- Hardware (category 2)
  ('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0000-000000000001',
   'DELL-R750', 'Dell PowerEdge R750xs', 'Servidor Xeon Silver 4314 - 32GB RAM',
   '00000000-0000-0000-0003-000000000002', 'Dell',
   6747.00, 28000000, 38500000, 'COP', false, false, false, 36, true),

  ('00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0000-000000000001',
   'LEN-X1C', 'Lenovo ThinkPad X1 Carbon Gen 12', 'i7/16GB/512GB SSD',
   '00000000-0000-0000-0003-000000000002', 'Lenovo',
   1397.60, 5800000, 7800000, 'COP', false, false, false, 12, true),

  ('00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0000-000000000001',
   'HP-M428', 'HP LaserJet Pro MFP M428fdw', 'Impresora multifuncional',
   '00000000-0000-0000-0003-000000000002', 'HP',
   506.00, 2100000, 2950000, 'COP', false, false, false, 12, true),

  -- Accesorios (category 3)
  ('00000000-0000-0000-0004-000000000011', '00000000-0000-0000-0000-000000000001',
   'CISCO-9200', 'Cisco Catalyst 9200L-48P', 'Switch 48 puertos PoE+',
   '00000000-0000-0000-0003-000000000003', 'Cisco',
   3012.00, 12500000, 17200000, 'COP', false, false, false, 36, true),

  -- Servicios (category 4)
  ('00000000-0000-0000-0004-000000000007', '00000000-0000-0000-0000-000000000001',
   'AWS-EC2-RI', 'AWS EC2 Reserved Instance', 'm5.xlarge reservada 1 año',
   '00000000-0000-0000-0003-000000000004', 'AWS',
   950.00, 3942500, 5600000, 'USD', true, false, false, NULL, true),

  ('00000000-0000-0000-0004-000000000008', '00000000-0000-0000-0000-000000000001',
   'AZ-SQL', 'Azure SQL Database S3', 'Standard tier mensual',
   '00000000-0000-0000-0003-000000000004', 'Microsoft',
   380.00, 1577000, 2200000, 'USD', true, false, false, NULL, true),

  ('00000000-0000-0000-0004-000000000012', '00000000-0000-0000-0000-000000000001',
   'CONS-SR', 'Hora Consultoría Senior', 'Consultoría especializada nivel Senior',
   '00000000-0000-0000-0003-000000000004', NULL,
   43.37, 180000, 280000, 'COP', true, false, false, NULL, true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 0.7.7: Customers (5 demo)
-- Columns: id, organization_id, business_name, nit, industry, address, city,
--   phone, email, website, credit_limit, credit_available, credit_status,
--   payment_terms, is_active
-- ============================================================================

INSERT INTO customers (id, organization_id, business_name, nit, industry, address, city,
  phone, email, website, credit_limit, credit_available, credit_status, payment_terms, is_active) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001',
   'Banco Davivienda S.A.', '860034313-7', 'Financiero',
   'Av. El Dorado No. 68C-61', 'Bogotá',
   '601-330-0000', 'compras@davivienda.com', 'www.davivienda.com',
   500000000.00, 500000000.00, 'approved', 'credit_30', true),

  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001',
   'Ecopetrol S.A.', '899999068-1', 'Energía',
   'Cra 13 No. 36-24', 'Bogotá',
   '601-234-4000', 'adquisiciones@ecopetrol.com.co', 'www.ecopetrol.com.co',
   800000000.00, 800000000.00, 'approved', 'credit_60', true),

  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001',
   'Universidad de los Andes', '860007386-1', 'Educación',
   'Cra 1 No. 18A-12', 'Bogotá',
   '601-339-4999', 'compras@uniandes.edu.co', 'www.uniandes.edu.co',
   200000000.00, 200000000.00, 'approved', 'credit_30', true),

  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001',
   'Grupo Nutresa S.A.', '890900266-8', 'Alimentos',
   'Cra 52 No. 2-38', 'Medellín',
   '604-251-0200', 'tecnologia@nutresa.com', 'www.gruponutresa.com',
   350000000.00, 350000000.00, 'approved', 'credit_30', true),

  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001',
   'Clínica Fundación Santa Fe', '860037950-5', 'Salud',
   'Calle 119 No. 7-75', 'Bogotá',
   '601-603-0303', 'sistemas@fsfb.org.co', 'www.fsfb.org.co',
   150000000.00, 150000000.00, 'approved', 'anticipated', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- Customer Contacts (10 contacts, 2 per customer)
-- Columns: organization_id, customer_id, full_name, email, phone, position,
--   is_primary, is_active
-- ============================================================================

INSERT INTO customer_contacts (organization_id, customer_id, full_name, email, phone, position, is_primary, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001',
   'Carlos Mendoza', 'carlos.mendoza@davivienda.com', '311-234-5678', 'Director de Tecnología', true, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001',
   'Laura Patiño', 'laura.patino@davivienda.com', '312-345-6789', 'Analista de Compras TI', false, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000002',
   'Roberto Vargas', 'roberto.vargas@ecopetrol.com.co', '310-456-7890', 'Gerente de Sistemas', true, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000002',
   'Ana María Torres', 'ana.torres@ecopetrol.com.co', '315-567-8901', 'Coordinadora de Adquisiciones', false, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000003',
   'Diego Ramírez', 'diego.ramirez@uniandes.edu.co', '318-678-9012', 'Jefe de Infraestructura TI', true, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000003',
   'Sandra Mejía', 'sandra.mejia@uniandes.edu.co', '320-789-0123', 'Coordinadora de Compras', false, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000004',
   'Andrés Gómez', 'andres.gomez@nutresa.com', '313-890-1234', 'Director TI', true, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000004',
   'Mónica Rivera', 'monica.rivera@nutresa.com', '317-901-2345', 'Analista de Infraestructura', false, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000005',
   'Patricia Herrera', 'patricia.herrera@fsfb.org.co', '316-012-3456', 'Coordinadora de Sistemas', true, true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000005',
   'Jorge Castillo', 'jorge.castillo@fsfb.org.co', '314-123-4567', 'Ingeniero de Soporte', false, true)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- Leads (8 demo, various statuses)
-- Columns: organization_id, lead_number, business_name, nit, contact_name,
--   phone, email, requirement, channel, status, customer_id
-- NOTE: assigned_to requires auth.users, left NULL for now
-- ============================================================================

INSERT INTO leads (organization_id, lead_number, business_name, nit, contact_name, phone, email,
  requirement, channel, status, customer_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 101,
   'Banco Davivienda S.A.', '860034313-7', 'Carlos Mendoza',
   '311-234-5678', 'carlos.mendoza@davivienda.com',
   'Renovación de 500 licencias Microsoft 365 Business Premium para toda la operación bancaria.',
   'manual', 'assigned', '00000000-0000-0000-0002-000000000001'),

  ('00000000-0000-0000-0000-000000000001', 102,
   'Ecopetrol S.A.', '899999068-1', 'Roberto Vargas',
   '310-456-7890', 'roberto.vargas@ecopetrol.com.co',
   'Servidor Dell PowerEdge R750xs para migración de SAP HANA en la refinería de Barrancabermeja.',
   'web', 'assigned', '00000000-0000-0000-0002-000000000002'),

  ('00000000-0000-0000-0000-000000000001', 103,
   'Universidad de los Andes', '860007386-1', 'Diego Ramírez',
   '318-678-9012', 'diego.ramirez@uniandes.edu.co',
   'Migrar 10 aplicaciones académicas a AWS con instancias reservadas m5.xlarge.',
   'web', 'assigned', '00000000-0000-0000-0002-000000000003'),

  ('00000000-0000-0000-0000-000000000001', 104,
   'Grupo Nutresa S.A.', '890900266-8', 'Andrés Gómez',
   '313-890-1234', 'andres.gomez@nutresa.com',
   'Implementación de Kaspersky Endpoint Security para 2000 equipos en todas las plantas.',
   'manual', 'assigned', '00000000-0000-0000-0002-000000000004'),

  ('00000000-0000-0000-0000-000000000001', 105,
   'Clínica Fundación Santa Fe', '860037950-5', 'Patricia Herrera',
   '316-012-3456', 'patricia.herrera@fsfb.org.co',
   '20 switches Cisco Catalyst 9200L para nueva sede hospitalaria.',
   'manual', 'created', '00000000-0000-0000-0002-000000000005'),

  ('00000000-0000-0000-0000-000000000001', 106,
   'Banco Davivienda S.A.', '860034313-7', 'Laura Patiño',
   '312-345-6789', 'laura.patino@davivienda.com',
   '200 horas de consultoría para migración de bases de datos a Azure SQL Database.',
   'whatsapp', 'created', '00000000-0000-0000-0002-000000000001'),

  ('00000000-0000-0000-0000-000000000001', 107,
   'Ecopetrol S.A.', '899999068-1', 'Ana María Torres',
   '315-567-8901', 'ana.torres@ecopetrol.com.co',
   'Ampliación de 50 sockets Veeam Backup Enterprise para infraestructura de respaldos.',
   'manual', 'converted', '00000000-0000-0000-0002-000000000002'),

  ('00000000-0000-0000-0000-000000000001', 108,
   'Universidad de los Andes', '860007386-1', 'Sandra Mejía',
   '320-789-0123', 'sandra.mejia@uniandes.edu.co',
   '50 ThinkPad X1 Carbon Gen 12 para profesores de la facultad de ingeniería.',
   'web', 'rejected', '00000000-0000-0000-0002-000000000003')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 0.7.9: Consecutive Counters
-- Leads: start 100, current 108 (8 leads inserted)
-- Quotes: start 30000
-- Orders: start 20000 (per spec)
-- ============================================================================

INSERT INTO consecutive_counters (organization_id, entity_type, prefix, current_value, start_value, increment) VALUES
  ('00000000-0000-0000-0000-000000000001', 'lead', NULL, 108, 100, 1),
  ('00000000-0000-0000-0000-000000000001', 'quote', 'COT-', 30000, 30000, 1),
  ('00000000-0000-0000-0000-000000000001', 'order', 'PED-', 20000, 20000, 1),
  ('00000000-0000-0000-0000-000000000001', 'purchase_order', 'OC-', 1, 1, 1),
  ('00000000-0000-0000-0000-000000000001', 'shipment', 'DSP-', 1, 1, 1),
  ('00000000-0000-0000-0000-000000000001', 'invoice', 'FAC-', 1, 1, 1)
ON CONFLICT (organization_id, entity_type) DO NOTHING;


-- ============================================================================
-- 0.7.7: Margin Rules - Full matrix: 4 payment_types × 5 categories = 20 rules
-- CHECK constraint: anticipated, credit_30, credit_60, credit_90
-- Columns: organization_id, category_id, payment_type, min_margin_pct,
--   target_margin_pct, max_discount_pct, requires_approval_below,
--   approval_role_slug, is_active
-- ============================================================================

INSERT INTO margin_rules (organization_id, category_id, payment_type, min_margin_pct,
  target_margin_pct, max_discount_pct, requires_approval_below, approval_role_slug, is_active) VALUES
  -- Software × 4 payment types
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000001',
   'anticipated', 18.00, 28.00, 10.00, 15.00, 'gerente_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000001',
   'credit_30', 20.00, 30.00, 8.00, 18.00, 'gerente_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000001',
   'credit_60', 22.00, 32.00, 6.00, 20.00, 'director_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000001',
   'credit_90', 25.00, 35.00, 5.00, 22.00, 'director_comercial', true),
  -- Hardware × 4 payment types
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000002',
   'anticipated', 22.00, 32.00, 8.00, 18.00, 'gerente_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000002',
   'credit_30', 25.00, 35.00, 6.00, 22.00, 'gerente_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000002',
   'credit_60', 28.00, 38.00, 5.00, 25.00, 'director_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000002',
   'credit_90', 30.00, 40.00, 4.00, 28.00, 'director_comercial', true),
  -- Accesorios × 4 payment types
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000003',
   'anticipated', 20.00, 30.00, 10.00, 15.00, 'gerente_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000003',
   'credit_30', 22.00, 32.00, 8.00, 18.00, 'gerente_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000003',
   'credit_60', 25.00, 35.00, 6.00, 20.00, 'director_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000003',
   'credit_90', 28.00, 38.00, 5.00, 25.00, 'director_comercial', true),
  -- Servicios × 4 payment types
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000004',
   'anticipated', 30.00, 42.00, 15.00, 25.00, 'director_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000004',
   'credit_30', 32.00, 44.00, 12.00, 28.00, 'director_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000004',
   'credit_60', 35.00, 46.00, 10.00, 30.00, 'director_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000004',
   'credit_90', 38.00, 48.00, 8.00, 33.00, 'director_comercial', true),
  -- Otros × 4 payment types
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000005',
   'anticipated', 15.00, 25.00, 12.00, 12.00, 'gerente_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000005',
   'credit_30', 18.00, 28.00, 10.00, 15.00, 'gerente_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000005',
   'credit_60', 20.00, 30.00, 8.00, 18.00, 'director_comercial', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000005',
   'credit_90', 22.00, 32.00, 6.00, 20.00, 'director_comercial', true)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 0.7.3: Formas de Pago (via system_settings - no dedicated table)
-- 0.7.4: Monedas (via system_settings - no dedicated table)
-- 0.7.5: Vías de Contacto / Canales (via system_settings)
-- 0.7.8: Impuestos (via system_settings - no dedicated table)
-- 0.7.10: Departamentos Colombia (via system_settings)
-- Plus operational settings
-- ============================================================================

INSERT INTO system_settings (organization_id, key, value, description) VALUES
  -- 0.7.3: Payment types (matches CHECK constraint: anticipated, credit_30, credit_60, credit_90)
  ('00000000-0000-0000-0000-000000000001', 'payment_types', '[
    {"value": "anticipated", "label": "Anticipado", "days": 0},
    {"value": "credit_30", "label": "Crédito 30 días", "days": 30},
    {"value": "credit_60", "label": "Crédito 60 días", "days": 60},
    {"value": "credit_90", "label": "Crédito 90 días", "days": 90}
  ]'::jsonb,
   'Available payment types for quotes and orders'),

  -- 0.7.4: Currencies (matches CHECK constraint: COP, USD)
  ('00000000-0000-0000-0000-000000000001', 'currencies', '[
    {"code": "COP", "name": "Peso Colombiano", "symbol": "$", "decimals": 0},
    {"code": "USD", "name": "Dólar Estadounidense", "symbol": "US$", "decimals": 2}
  ]'::jsonb,
   'Supported currencies'),

  -- 0.7.5: Contact channels for leads
  ('00000000-0000-0000-0000-000000000001', 'lead_channels', '[
    {"value": "whatsapp", "label": "WhatsApp"},
    {"value": "web", "label": "Formulario Web"},
    {"value": "manual", "label": "Registro Manual"}
  ]'::jsonb,
   'Available channels for lead capture (matches CHECK constraint)'),

  -- 0.7.5: Follow-up channels
  ('00000000-0000-0000-0000-000000000001', 'followup_channels', '[
    {"value": "internal", "label": "Nota Interna"},
    {"value": "email", "label": "Correo Electrónico"},
    {"value": "whatsapp", "label": "WhatsApp"},
    {"value": "phone", "label": "Llamada Telefónica"},
    {"value": "meeting", "label": "Reunión"},
    {"value": "visit", "label": "Visita Presencial"},
    {"value": "video_call", "label": "Videollamada"},
    {"value": "other", "label": "Otro"}
  ]'::jsonb,
   'Available channels for follow-ups and contact tracking'),

  -- 0.7.8: Tax rates (IVA Colombia)
  ('00000000-0000-0000-0000-000000000001', 'tax_rates', '[
    {"value": 0, "label": "Exento (0%)", "description": "Productos/servicios exentos de IVA"},
    {"value": 5, "label": "Reducido (5%)", "description": "Tarifa reducida IVA"},
    {"value": 19, "label": "General (19%)", "description": "Tarifa general IVA Colombia", "is_default": true}
  ]'::jsonb,
   'Available tax rates (IVA Colombia)'),

  -- 0.7.10: 33 Departamentos de Colombia
  ('00000000-0000-0000-0000-000000000001', 'departments_colombia', '[
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.",
    "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare",
    "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca",
    "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena",
    "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío",
    "Risaralda", "San Andrés y Providencia", "Santander", "Sucre",
    "Tolima", "Valle del Cauca", "Vaupés", "Vichada"
  ]'::jsonb,
   '33 departamentos de Colombia para selects de dirección'),

  -- Operational settings
  ('00000000-0000-0000-0000-000000000001', 'trm_auto_fetch', '"true"'::jsonb,
   'Auto-fetch TRM from Banco de la República daily'),
  ('00000000-0000-0000-0000-000000000001', 'lead_auto_assign', '"round_robin"'::jsonb,
   'Lead auto-assignment strategy: round_robin, load_balanced, manual'),
  ('00000000-0000-0000-0000-000000000001', 'lead_max_per_advisor', '5'::jsonb,
   'Maximum pending leads per advisor before reassignment'),
  ('00000000-0000-0000-0000-000000000001', 'quote_validity_days', '30'::jsonb,
   'Default number of days a quote remains valid'),
  ('00000000-0000-0000-0000-000000000001', 'quote_min_margin_percent', '15'::jsonb,
   'Minimum margin % before requiring management approval'),
  ('00000000-0000-0000-0000-000000000001', 'quote_reminder_days', '8'::jsonb,
   'Days before sending a quote follow-up reminder'),
  ('00000000-0000-0000-0000-000000000001', 'invoice_prefix', '"FAC-"'::jsonb,
   'Prefix for invoice numbers'),
  ('00000000-0000-0000-0000-000000000001', 'currency_default', '"COP"'::jsonb,
   'Default currency for new quotes and orders'),
  ('00000000-0000-0000-0000-000000000001', 'company_info', '{
    "name": "PROSUMINISTROS S.A.S.",
    "nit": "900.123.456-7",
    "address": "Cra 15 No. 93-75 Of. 501",
    "city": "Bogotá D.C.",
    "department": "Cundinamarca",
    "phone": "+57 601 742 3000",
    "email": "info@prosuministros.com",
    "website": "www.prosuministros.com",
    "bank_name": "Bancolombia",
    "bank_account": "69812345678",
    "bank_account_type": "Corriente"
  }'::jsonb,
   'Company information for documents and PDFs'),
  ('00000000-0000-0000-0000-000000000001', 'notification_channels',
   '{"email": true, "push": true, "whatsapp": false}'::jsonb,
   'Active notification channels')
ON CONFLICT (organization_id, key) DO NOTHING;


-- ============================================================================
-- Rejection Reasons (15 across 3 entity types)
-- Columns: organization_id, entity_type, label, sort_order, is_active
-- ============================================================================

INSERT INTO rejection_reasons (organization_id, entity_type, label, sort_order, is_active) VALUES
  -- Lead rejection reasons
  ('00000000-0000-0000-0000-000000000001', 'lead', 'Sin presupuesto disponible', 1, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'No es el momento adecuado', 2, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'Eligió a la competencia', 3, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'Sin respuesta del contacto', 4, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'No califica como prospecto', 5, true),
  ('00000000-0000-0000-0000-000000000001', 'lead', 'Lead duplicado', 6, true),
  -- Quote rejection reasons
  ('00000000-0000-0000-0000-000000000001', 'quote', 'Precio muy alto', 1, true),
  ('00000000-0000-0000-0000-000000000001', 'quote', 'Cambio en el alcance del proyecto', 2, true),
  ('00000000-0000-0000-0000-000000000001', 'quote', 'Mejor oferta de competencia', 3, true),
  ('00000000-0000-0000-0000-000000000001', 'quote', 'Recorte de presupuesto', 4, true),
  ('00000000-0000-0000-0000-000000000001', 'quote', 'Tiempo de entrega no aceptable', 5, true),
  -- Order cancellation reasons
  ('00000000-0000-0000-0000-000000000001', 'order', 'Cancelación por el cliente', 1, true),
  ('00000000-0000-0000-0000-000000000001', 'order', 'Producto descontinuado o sin stock', 2, true),
  ('00000000-0000-0000-0000-000000000001', 'order', 'Excede límite de crédito', 3, true),
  ('00000000-0000-0000-0000-000000000001', 'order', 'Fuerza mayor', 4, true)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- TRM Rate (current)
-- Columns: organization_id, rate_date, rate_value, source
-- ============================================================================

INSERT INTO trm_rates (organization_id, rate_date, rate_value, source) VALUES
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 4150.00, 'manual')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- Suppliers (3 demo)
-- Columns: organization_id, name, nit, contact_name, email, phone, address,
--   city, country, payment_terms, lead_time_days, is_active
-- ============================================================================

INSERT INTO suppliers (organization_id, name, nit, contact_name, email, phone,
  address, city, country, payment_terms, lead_time_days, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Ingram Micro Colombia', '830067217-1', 'Fernando Ríos',
   'fernando.rios@ingrammicro.com', '601-423-5000',
   'Cra 7 No. 156-68 Of. 301', 'Bogotá', 'Colombia', 'credit_30', 5, true),
  ('00000000-0000-0000-0000-000000000001',
   'TD SYNNEX Latam', '900854321-5', 'María Eugenia Pérez',
   'maria.perez@tdsynnex.com', '601-756-2000',
   'Av. Calle 26 No. 69D-91 Torre 1', 'Bogotá', 'Colombia', 'credit_60', 7, true),
  ('00000000-0000-0000-0000-000000000001',
   'Licencias OnLine', '900765432-3', 'Alejandro Muñoz',
   'alejandro.munoz@licenciasonline.com', '601-312-8000',
   'Cra 11A No. 93-67 Of. 405', 'Bogotá', 'Colombia', 'credit_30', 3, true)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 0.7.2: Super Admin User (admin@prosuministros.com)
-- Creates auth.users + profiles + user_roles in one transaction
-- Password: Admin2026! (CHANGE IN PRODUCTION)
-- Uses pgcrypto crypt() available in Supabase
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000099';
  v_super_admin_role_id uuid;
BEGIN
  -- Only create if user doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN

    -- 1. Create auth.users record
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@prosuministros.com',
      crypt('Admin2026!', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "Administrador PROSUMINISTROS"}'::jsonb,
      false,
      now(),
      now(),
      '',
      ''
    );

    -- 2. Create auth.identities record (required by Supabase Auth)
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      'email',
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'admin@prosuministros.com',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      now()
    );

    -- 3. Create profile
    INSERT INTO profiles (
      id, organization_id, full_name, email, phone,
      area, position, is_active, is_available, max_pending_leads
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000001',
      'Administrador PROSUMINISTROS',
      'admin@prosuministros.com',
      '+57 601 742 3000',
      'Administración',
      'Super Administrador',
      true,
      false,
      0
    );

    -- 4. Assign super_admin role
    SELECT id INTO v_super_admin_role_id
    FROM roles
    WHERE slug = 'super_admin'
      AND organization_id = '00000000-0000-0000-0000-000000000001';

    IF v_super_admin_role_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES (v_user_id, v_super_admin_role_id, v_user_id);
    END IF;

    RAISE NOTICE 'Super Admin created: admin@prosuministros.com / Admin2026!';
  ELSE
    RAISE NOTICE 'Super Admin already exists, skipping.';
  END IF;
END $$;


-- ============================================================================
-- Summary:
-- 5 product categories (spec verticals) | 12 products | 5 customers | 10 contacts
-- 8 leads | 16 system settings (incl. lookups) | 15 rejection reasons | 1 TRM rate
-- 6 consecutive counters | 20 margin rules (4×5 full matrix) | 3 suppliers
-- 1 super admin user (admin@prosuministros.com / Admin2026!)
-- Lookups via system_settings: payment_types, currencies, lead_channels,
--   followup_channels, tax_rates, departments_colombia
-- ============================================================================
