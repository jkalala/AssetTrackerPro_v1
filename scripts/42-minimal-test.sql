-- =====================================================
-- MINIMAL TEST FOR MIGRATION 42
-- =====================================================
-- This is a minimal version to test where the error occurs

-- Test 1: Check if tenants table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        RAISE NOTICE 'SUCCESS: tenants table exists';
    ELSE
        RAISE EXCEPTION 'FAILED: tenants table does not exist - required for tenant_id foreign keys';
    END IF;
END $$;

-- Test 2: Create a safe function that doesn't reference tenant_id
CREATE OR REPLACE FUNCTION test_get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Just return NULL for testing - no column dependencies
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test 3: Try to add tenant_id to profiles table if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'SUCCESS: profiles table exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
            RAISE NOTICE 'INFO: Adding tenant_id column to profiles table';
            ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
            RAISE NOTICE 'SUCCESS: Added tenant_id column to profiles';
        ELSE
            RAISE NOTICE 'INFO: tenant_id column already exists in profiles';
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: profiles table does not exist';
    END IF;
END $$;

-- Test 4: Clean up test function
DROP FUNCTION test_get_current_tenant_id();

-- Final result
SELECT 'Minimal test completed successfully' as result;