-- ============================================================================
-- FIX: Remove orphaned auth.accounts record
-- The previous cleanup missed this because of type mismatch.
-- Try multiple approaches to ensure deletion.
-- ============================================================================

DO $$
BEGIN
  -- Try with text cast
  BEGIN
    EXECUTE 'DELETE FROM auth.accounts WHERE id = $1' USING '00000000-0000-0000-0000-000000000099'::text;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'text approach failed: %', SQLERRM;
  END;

  -- Try with uuid cast
  BEGIN
    EXECUTE 'DELETE FROM auth.accounts WHERE id = $1' USING '00000000-0000-0000-0000-000000000099'::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'uuid approach failed: %', SQLERRM;
  END;

  -- Try with explicit cast in query
  BEGIN
    EXECUTE 'DELETE FROM auth.accounts WHERE id::text = $1' USING '00000000-0000-0000-0000-000000000099';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'cast approach failed: %', SQLERRM;
  END;

  RAISE NOTICE 'auth.accounts cleanup attempted';
END $$;
