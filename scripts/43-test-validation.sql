-- =====================================================
-- TEST SCRIPT FOR MIGRATION 43 VALIDATION FIX
-- =====================================================
-- This script tests the specific validation logic that was causing the ambiguous reference error

-- Test the validation logic in isolation
DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    required_table TEXT;
    test_result TEXT;
BEGIN
    RAISE NOTICE 'Testing table validation logic...';
    
    -- Check for required tables (same logic as in migration 43)
    FOR required_table IN VALUES ('tenants'), ('profiles'), ('api_keys'), ('user_sessions'), ('mfa_configurations'), ('security_events') LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = required_table) THEN
            missing_tables := array_append(missing_tables, required_table);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        test_result := 'Missing required tables: ' || array_to_string(missing_tables, ', ');
        RAISE NOTICE 'RESULT: %', test_result;
    ELSE
        RAISE NOTICE 'SUCCESS: All required tables exist';
    END IF;
    
    RAISE NOTICE 'Validation logic test completed successfully';
END $$;

SELECT 'Validation test completed' as status;