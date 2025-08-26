-- =====================================================
-- E2E AUTHENTICATION MIGRATIONS TEST
-- =====================================================
-- This script tests the E2E authentication migrations to ensure they work correctly

-- Test 1: Check if required functions exist
DO $$
BEGIN
    -- Test get_current_tenant_id function
    PERFORM get_current_tenant_id();
    RAISE NOTICE 'SUCCESS: get_current_tenant_id() function exists and works';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: get_current_tenant_id() function error: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Test has_any_role function
    PERFORM has_any_role(ARRAY['admin', 'user']);
    RAISE NOTICE 'SUCCESS: has_any_role() function exists and works';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: has_any_role() function error: %', SQLERRM;
END $$;

-- Test 2: Check if required tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('mfa_configurations', 'user_sessions', 'security_events', 'api_keys');
    
    IF table_count >= 4 THEN
        RAISE NOTICE 'SUCCESS: All required tables exist (found % tables)', table_count;
    ELSE
        RAISE EXCEPTION 'FAILED: Missing tables (found only % out of 4)', table_count;
    END IF;
END $$;

-- Test 3: Check if RLS policies exist
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('mfa_configurations', 'user_sessions', 'security_events', 'api_keys');
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'SUCCESS: RLS policies exist (found % policies)', policy_count;
    ELSE
        RAISE WARNING 'WARNING: No RLS policies found';
    END IF;
END $$;

-- Test 4: Check if indexes exist
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename IN ('mfa_configurations', 'user_sessions', 'security_events', 'api_keys');
    
    IF index_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Performance indexes exist (found % indexes)', index_count;
    ELSE
        RAISE WARNING 'WARNING: No performance indexes found';
    END IF;
END $$;

-- Test 5: Test MFA functions if they exist
DO $$
BEGIN
    -- Test generate_mfa_backup_codes function
    PERFORM generate_mfa_backup_codes();
    RAISE NOTICE 'SUCCESS: generate_mfa_backup_codes() function works';
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'INFO: generate_mfa_backup_codes() function not yet defined (will be created in complete migration)';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: generate_mfa_backup_codes() function error: %', SQLERRM;
END $$;

-- Test 6: Test session functions if they exist
DO $$
BEGIN
    -- Test cleanup_expired_user_sessions function
    PERFORM cleanup_expired_user_sessions();
    RAISE NOTICE 'SUCCESS: cleanup_expired_user_sessions() function works';
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'INFO: cleanup_expired_user_sessions() function not yet defined (will be created in session migration)';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: cleanup_expired_user_sessions() function error: %', SQLERRM;
END $$;

-- Test 7: Test API key functions if they exist
DO $$
BEGIN
    -- Test generate_api_key_with_prefix function
    PERFORM generate_api_key_with_prefix();
    RAISE NOTICE 'SUCCESS: generate_api_key_with_prefix() function works';
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'INFO: generate_api_key_with_prefix() function not yet defined (will be created in API keys migration)';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: generate_api_key_with_prefix() function error: %', SQLERRM;
END $$;

-- Final test result
SELECT 'E2E Authentication Migrations Test Completed' as test_status,
       NOW() as test_completed_at;