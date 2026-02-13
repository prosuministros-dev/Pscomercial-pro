-- ============================================================================
-- FIX: Complete cleanup of broken admin user from ALL auth tables
-- The manual INSERT into auth.users created an incomplete record that GoTrue
-- cannot read. This migration removes ALL traces so we can recreate properly
-- via the Supabase Admin API.
-- NOTE: Some auth tables use varchar for user_id, so we cast to text.
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000099';
  v_user_id_text text := '00000000-0000-0000-0000-000000000099';
BEGIN
  -- 1. Clean custom tables first (our app tables, these use uuid)
  DELETE FROM user_roles WHERE user_id = v_user_id;
  DELETE FROM profiles WHERE id = v_user_id;

  -- 2. Clean auth tables (some use varchar, some use uuid)
  -- Use sub-blocks with exception handling for tables that may not exist

  -- auth.mfa_amr_claims references sessions
  BEGIN
    EXECUTE 'DELETE FROM auth.mfa_amr_claims WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = $1)' USING v_user_id;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL;
  END;

  -- auth.mfa_challenges references mfa_factors
  BEGIN
    EXECUTE 'DELETE FROM auth.mfa_challenges WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = $1)' USING v_user_id;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL;
  END;

  BEGIN
    EXECUTE 'DELETE FROM auth.mfa_factors WHERE user_id = $1' USING v_user_id;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL;
  END;

  BEGIN
    EXECUTE 'DELETE FROM auth.one_time_tokens WHERE user_id = $1' USING v_user_id;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL;
  END;

  BEGIN
    EXECUTE 'DELETE FROM auth.flow_state WHERE user_id = $1' USING v_user_id;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL;
  END;

  -- refresh_tokens.user_id is varchar in some versions
  BEGIN
    EXECUTE 'DELETE FROM auth.refresh_tokens WHERE user_id = $1' USING v_user_id_text;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL;
  END;

  BEGIN
    EXECUTE 'DELETE FROM auth.sessions WHERE user_id = $1' USING v_user_id;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL;
  END;

  DELETE FROM auth.identities WHERE user_id = v_user_id;

  -- auth.accounts may exist in newer Supabase versions
  BEGIN
    EXECUTE 'DELETE FROM auth.accounts WHERE id = $1' USING v_user_id;
  EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL;
  END;

  DELETE FROM auth.users WHERE id = v_user_id;

  RAISE NOTICE 'Broken admin user cleaned up from all tables';
END $$;
