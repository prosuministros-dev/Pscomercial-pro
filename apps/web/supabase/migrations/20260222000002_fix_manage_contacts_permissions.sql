-- Fix: Add customers:manage_contacts permission to Gerente General and Super Administrador
-- These roles were missing this permission, blocking contact CRUD for those users.
-- Also fixes the RLS DELETE policy on customer_contacts which uses has_perm().

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.slug = 'customers:manage_contacts'
  AND r.slug IN ('gerente_general', 'super_admin')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
