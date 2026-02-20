-- ============================================================================
-- FIX: Admin user auth records
-- Migration: 20260213000001_fix_admin_auth.sql
-- Problem: Manual INSERT into auth.users/identities used wrong provider_id
--   (was UUID, should be email). GoTrue v2 looks up identities by
--   (provider='email', provider_id=email_address) causing 500 on sign-in.
-- Fix: UPDATE existing records instead of DELETE/INSERT to avoid FK issues
--   with internal auth.accounts table.
-- ============================================================================

-- Fix 1: Update identity provider_id from UUID to email (GoTrue v2 requirement)
UPDATE auth.identities
SET provider_id = 'admin@prosuministros.com'
WHERE user_id = '00000000-0000-0000-0000-000000000099'
  AND provider = 'email';

-- Fix 2: Rehash password with proper bcrypt cost factor (10)
UPDATE auth.users
SET encrypted_password = crypt('Admin2026!', gen_salt('bf', 10))
WHERE id = '00000000-0000-0000-0000-000000000099';
