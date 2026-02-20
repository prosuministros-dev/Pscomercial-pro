-- ============================================================================
-- FIX: Remove orphaned record from public.accounts
-- Root cause: The initial kit migration (20241219010757) has a trigger
-- "on_auth_user_created" on auth.users that auto-inserts into public.accounts.
-- When we manually inserted into auth.users, the trigger created a
-- public.accounts record. Our cleanup deleted auth.users but NOT
-- public.accounts, leaving an orphan that blocks re-creation.
-- ============================================================================

DELETE FROM public.accounts
WHERE id = '00000000-0000-0000-0000-000000000099';
