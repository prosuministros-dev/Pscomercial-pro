-- ============================================================================
-- Create profile and assign super_admin role for the admin user
-- User created via Supabase Admin API: admin@prosuministros.com
-- UUID: f7878c21-249e-416d-bd97-120626ea1a72
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid := 'f7878c21-249e-416d-bd97-120626ea1a72';
  v_org_id uuid := '00000000-0000-0000-0000-000000000001';
  v_super_admin_role_id uuid;
BEGIN
  -- Create profile (skip if already exists from trigger)
  INSERT INTO profiles (
    id, organization_id, full_name, email, phone,
    area, position, is_active, is_available, max_pending_leads
  ) VALUES (
    v_user_id, v_org_id,
    'Administrador PROSUMINISTROS',
    'admin@prosuministros.com',
    '+57 601 742 3000',
    'Administración',
    'Super Administrador',
    true, false, 0
  ) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    full_name = EXCLUDED.full_name,
    area = EXCLUDED.area,
    position = EXCLUDED.position;

  -- Assign super_admin role
  SELECT id INTO v_super_admin_role_id
  FROM roles
  WHERE slug = 'super_admin'
    AND organization_id = v_org_id;

  IF v_super_admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (v_user_id, v_super_admin_role_id, v_user_id)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Super Admin role assigned to admin@prosuministros.com';
  ELSE
    RAISE NOTICE 'WARNING: super_admin role not found!';
  END IF;
END $$;
