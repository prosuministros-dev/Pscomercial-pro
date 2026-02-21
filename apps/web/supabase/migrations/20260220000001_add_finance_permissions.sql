-- Add finance module permissions
INSERT INTO public.permissions (module, action, slug, description) VALUES
  ('finance', 'read', 'finance:read', 'Ver módulo financiero'),
  ('finance', 'manage_credit', 'finance:manage_credit', 'Gestionar crédito y cartera'),
  ('finance', 'block_customer', 'finance:block_customer', 'Bloquear/desbloquear clientes por cartera'),
  ('finance', 'approve_payment', 'finance:approve_payment', 'Verificar y aprobar pagos'),
  ('finance', 'generate_proforma', 'finance:generate_proforma', 'Generar proformas')
ON CONFLICT (slug) DO NOTHING;

-- Assign finance permissions to finanzas role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'finanzas'
  AND p.slug IN ('finance:read', 'finance:manage_credit', 'finance:block_customer', 'finance:approve_payment', 'finance:generate_proforma')
ON CONFLICT DO NOTHING;

-- Assign finance permissions to gerente_general role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'gerente_general'
  AND p.slug IN ('finance:read', 'finance:manage_credit', 'finance:block_customer', 'finance:approve_payment', 'finance:generate_proforma')
ON CONFLICT DO NOTHING;

-- Assign finance permissions to super_admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'super_admin'
  AND p.slug IN ('finance:read', 'finance:manage_credit', 'finance:block_customer', 'finance:approve_payment', 'finance:generate_proforma')
ON CONFLICT DO NOTHING;
