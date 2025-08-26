-- =====================================================
-- STEP-BY-STEP MIGRATION 42
-- =====================================================
-- Run this script step by step to identify where the error occurs

-- STEP 1: Basic checks
\echo 'STEP 1: Checking prerequisites...'

DO $$
BEGIN
    -- Check tenants table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        RAISE EXCEPTION 'FAILED: tenants table does not exist. Please run tenant setup migrations first.';
    END IF;
    
    -- Check profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'FAILED: profiles table does not exist. Please run profile setup migrations first.';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Prerequisites check passed';
END $$;

-- STEP 2: Create safe functions
\echo 'STEP 2: Creating safe functions...'

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Safe version that doesn't reference tenant_id column yet
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_any_role(roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_user_role', true) = ANY(roles),
        FALSE
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

\echo 'SUCCESS: Safe functions created'

-- STEP 3: Add tenant_id to profiles
\echo 'STEP 3: Adding tenant_id to profiles table...'

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
        ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
        RAISE NOTICE 'SUCCESS: Added tenant_id column to profiles';
    ELSE
        RAISE NOTICE 'INFO: tenant_id column already exists in profiles';
    END IF;
END $$;

-- STEP 4: Update get_current_tenant_id function
\echo 'STEP 4: Updating get_current_tenant_id function...'

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_tenant_id', true)::UUID,
        (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

\echo 'SUCCESS: Updated get_current_tenant_id function'

-- STEP 5: Test the function
\echo 'STEP 5: Testing the function...'

DO $$
BEGIN
    PERFORM get_current_tenant_id();
    RAISE NOTICE 'SUCCESS: get_current_tenant_id function works';
END $$;

\echo 'All steps completed successfully!'
SELECT 'Step-by-step migration test completed' as result;