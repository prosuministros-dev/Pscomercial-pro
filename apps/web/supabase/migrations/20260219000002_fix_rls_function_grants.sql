-- ============================================================================
-- FIX: Grant EXECUTE on RLS helper functions to authenticated role
-- Migration: 20260219000002_fix_rls_function_grants.sql
-- Date: 2026-02-19
-- Description: The RLS helper functions defined in 20260212000002_rls_policies.sql
--   were missing GRANT EXECUTE statements. Supabase revokes default execute
--   permissions, so authenticated users couldn't call these functions, causing
--   "permission denied for function get_user_org_id" errors on all table queries.
-- ============================================================================

-- Grant execute on RLS helper functions to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO service_role;

GRANT EXECUTE ON FUNCTION public.is_org_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin() TO service_role;

GRANT EXECUTE ON FUNCTION public.is_commercial_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_commercial_manager() TO service_role;

GRANT EXECUTE ON FUNCTION public.has_perm(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_perm(text) TO service_role;
