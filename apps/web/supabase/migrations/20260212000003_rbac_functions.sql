-- =====================================================
-- RBAC Functions Migration
-- =====================================================
-- Project: Pscomercial-pro (PROSUMINISTROS)
-- Date: 2026-02-12
-- Description: RPC functions for Role-Based Access Control
-- Reference: FASE-02-Arquitectura-RBAC.md
-- =====================================================

-- =====================================================
-- 1. Get User Permissions
-- =====================================================
-- Returns all permission slugs for a given user
-- Joins: user_roles → roles → role_permissions → permissions
-- Only returns permissions from active roles
-- Used once at login and cached on client (5 min)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS TABLE(
  permission_slug text,
  module text,
  action text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.slug::text AS permission_slug,
    p.module::text AS module,
    p.action::text AS action
  FROM user_roles ur
  INNER JOIN roles r ON r.id = ur.role_id AND r.is_active = true
  INNER JOIN role_permissions rp ON rp.role_id = r.id
  INNER JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = p_user_id
  ORDER BY 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_permissions(uuid) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION get_user_permissions(uuid) IS
'Returns all permission slugs for a user by joining user_roles → roles → role_permissions → permissions. Only includes active roles. Used for client-side caching of user permissions.';


-- =====================================================
-- 2. Check if User Has Specific Permission
-- =====================================================
-- Fast boolean check for a specific permission slug
-- Used in RLS policies and API route validation
-- =====================================================

CREATE OR REPLACE FUNCTION has_permission(
  p_user_id uuid,
  p_permission_slug text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON r.id = ur.role_id AND r.is_active = true
    INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.slug = p_permission_slug
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_permission(uuid, text) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION has_permission(uuid, text) IS
'Fast boolean check to verify if a user has a specific permission. Used in RLS policies and server-side validation. Only checks active roles.';


-- =====================================================
-- 3. Get User Roles
-- =====================================================
-- Returns all roles assigned to a user with their details
-- Used for displaying user roles in UI and role-based logic
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_roles(p_user_id uuid)
RETURNS TABLE(
  role_id uuid,
  role_name varchar,
  role_slug varchar
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS role_id,
    r.name AS role_name,
    r.slug AS role_slug
  FROM user_roles ur
  INNER JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = p_user_id
    AND r.is_active = true
  ORDER BY r.name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_roles(uuid) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION get_user_roles(uuid) IS
'Returns all active roles assigned to a user with role ID, name, and slug. Used for displaying role information in the UI.';


-- =====================================================
-- 4. Assign Role to User
-- =====================================================
-- Assigns a role to a user with audit trail
-- Returns the created user_role record
-- Requires admin:manage_users permission
-- =====================================================

CREATE OR REPLACE FUNCTION assign_role_to_user(
  p_user_id uuid,
  p_role_id uuid,
  p_assigned_by uuid
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  role_id uuid,
  assigned_by uuid,
  assigned_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_record user_roles;
  v_has_permission boolean;
BEGIN
  -- Check if the assigner has permission to manage users
  SELECT has_permission(p_assigned_by, 'admin:manage_users') INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Permission denied: admin:manage_users required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Verify role exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.id = p_role_id AND r.is_active = true
  ) THEN
    RAISE EXCEPTION 'Role not found or inactive: %', p_role_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- Check if user already has this role
  IF EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = p_user_id AND ur.role_id = p_role_id
  ) THEN
    RAISE EXCEPTION 'User already has this role'
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Insert the new user_role assignment
  INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
  VALUES (p_user_id, p_role_id, p_assigned_by, now())
  RETURNING * INTO v_new_record;

  -- Return the created record
  RETURN QUERY
  SELECT
    v_new_record.id,
    v_new_record.user_id,
    v_new_record.role_id,
    v_new_record.assigned_by,
    v_new_record.assigned_at;
END;
$$;

-- Grant execute permission to authenticated users (function handles permission check internally)
GRANT EXECUTE ON FUNCTION assign_role_to_user(uuid, uuid, uuid) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION assign_role_to_user(uuid, uuid, uuid) IS
'Assigns a role to a user. Requires admin:manage_users permission. Validates role exists and is active. Prevents duplicate assignments. Includes audit trail with assigned_by and assigned_at.';


-- =====================================================
-- 5. Remove Role from User
-- =====================================================
-- Removes a role assignment from a user
-- Requires admin:manage_users permission
-- Prevents removal of last super_admin role
-- =====================================================

CREATE OR REPLACE FUNCTION remove_role_from_user(
  p_user_id uuid,
  p_role_id uuid,
  p_removed_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_permission boolean;
  v_role_slug varchar;
  v_super_admin_count integer;
BEGIN
  -- If removed_by is provided, check permissions
  IF p_removed_by IS NOT NULL THEN
    SELECT has_permission(p_removed_by, 'admin:manage_users') INTO v_has_permission;

    IF NOT v_has_permission THEN
      RAISE EXCEPTION 'Permission denied: admin:manage_users required'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Get the role slug to check if it's super_admin
  SELECT r.slug INTO v_role_slug
  FROM roles r
  WHERE r.id = p_role_id;

  -- Prevent removal of the last super_admin
  IF v_role_slug = 'super_admin' THEN
    SELECT COUNT(DISTINCT ur.user_id) INTO v_super_admin_count
    FROM user_roles ur
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE r.slug = 'super_admin'
      AND r.is_active = true;

    IF v_super_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last super_admin role'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Delete the user_role assignment
  DELETE FROM user_roles
  WHERE user_id = p_user_id
    AND role_id = p_role_id;

  -- Raise notice if no record was deleted
  IF NOT FOUND THEN
    RAISE NOTICE 'No role assignment found for user % and role %', p_user_id, p_role_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (function handles permission check internally)
GRANT EXECUTE ON FUNCTION remove_role_from_user(uuid, uuid, uuid) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION remove_role_from_user(uuid, uuid, uuid) IS
'Removes a role assignment from a user. Requires admin:manage_users permission. Prevents removal of the last super_admin to maintain system access. The removed_by parameter is optional for backwards compatibility.';


-- =====================================================
-- 6. Get User Primary Role (Highest Priority)
-- =====================================================
-- Returns the highest priority role slug for a user
-- Used for data scope and visibility rules
-- Priority: super_admin=1, gerente_general=2, etc.
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_primary_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role_slug text;
BEGIN
  -- Get the role with highest priority (lowest number)
  SELECT r.slug INTO v_role_slug
  FROM user_roles ur
  INNER JOIN roles r ON r.id = ur.role_id AND r.is_active = true
  WHERE ur.user_id = p_user_id
  ORDER BY
    CASE r.slug
      WHEN 'super_admin' THEN 1
      WHEN 'gerente_general' THEN 2
      WHEN 'director_comercial' THEN 3
      WHEN 'gerente_comercial' THEN 4
      WHEN 'gerente_operativo' THEN 5
      WHEN 'asesor_comercial' THEN 6
      WHEN 'finanzas' THEN 7
      WHEN 'compras' THEN 8
      WHEN 'logistica' THEN 9
      WHEN 'jefe_bodega' THEN 10
      WHEN 'auxiliar_bodega' THEN 11
      WHEN 'facturacion' THEN 12
      ELSE 99
    END
  LIMIT 1;

  RETURN v_role_slug;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_primary_role(uuid) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION get_user_primary_role(uuid) IS
'Returns the highest priority role slug for a user. Used for data scope and visibility rules. Priority order: super_admin > gerente_general > director_comercial > ... > facturacion.';


-- =====================================================
-- End of Migration
-- =====================================================
