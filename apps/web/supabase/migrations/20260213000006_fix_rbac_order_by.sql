-- ============================================================================
-- FIX: get_user_permissions ORDER BY error
-- Error: "for SELECT DISTINCT, ORDER BY expressions must appear in select list"
-- Cause: ORDER BY p.slug but SELECT has p.slug::text (cast makes it different)
-- Fix: ORDER BY 1 (first column = permission_slug)
-- ============================================================================

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
