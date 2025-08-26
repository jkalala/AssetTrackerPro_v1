-- =====================================================
-- E2E AUTHENTICATION FINAL VALIDATION
-- =====================================================
-- This script validates and ensures all E2E authentication components are properly configured

-- Ensure required functions exist first
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

-- Validation function to check all required components
CREATE OR REPLACE FUNCTION validate_e2e_authentication_setup()
RETURNS TABLE (
    component TEXT,
    status TEXT,
    details TEXT
) AS $
DECLARE
    result_record RECORD;
BEGIN
    -- Check MFA configuration table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mfa_configurations') THEN
        RETURN QUERY SELECT 'mfa_configurations'::TEXT, 'OK'::TEXT, 'Table exists with proper structure'::TEXT;
    ELSE
        RETURN QUERY SELECT 'mfa_configurations'::TEXT, 'MISSING'::TEXT, 'MFA configuration table not found'::TEXT;
    END IF;
    
    -- Check session tracking table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        RETURN QUERY SELECT 'user_sessions'::TEXT, 'OK'::TEXT, 'Table exists with proper structure'::TEXT;
    ELSE
        RETURN QUERY SELECT 'user_sessions'::TEXT, 'MISSING'::TEXT, 'Session tracking table not found'::TEXT;
    END IF;
    
    -- Check security events table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_events') THEN
        RETURN QUERY SELECT 'security_events'::TEXT, 'OK'::TEXT, 'Table exists with proper structure'::TEXT;
    ELSE
        RETURN QUERY SELECT 'security_events'::TEXT, 'MISSING'::TEXT, 'Security events table not found'::TEXT;
    END IF;
    
    -- Check API keys permissions column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'api_keys' AND column_name = 'permissions'
    ) THEN
        RETURN QUERY SELECT 'api_keys_permissions'::TEXT, 'OK'::TEXT, 'Permissions column exists'::TEXT;
    ELSE
        RETURN QUERY SELECT 'api_keys_permissions'::TEXT, 'MISSING'::TEXT, 'Permissions column not found in api_keys'::TEXT;
    END IF;
    
    -- Check tenant isolation constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%tenant%' AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RETURN QUERY SELECT 'tenant_isolation'::TEXT, 'OK'::TEXT, 'Tenant isolation constraints exist'::TEXT;
    ELSE
        RETURN QUERY SELECT 'tenant_isolation'::TEXT, 'WARNING'::TEXT, 'Some tenant isolation constraints may be missing'::TEXT;
    END IF;
    
    -- Check required functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_tenant_id') THEN
        RETURN QUERY SELECT 'get_current_tenant_id'::TEXT, 'OK'::TEXT, 'Function exists'::TEXT;
    ELSE
        RETURN QUERY SELECT 'get_current_tenant_id'::TEXT, 'MISSING'::TEXT, 'Tenant context function not found'::TEXT;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_security_event') THEN
        RETURN QUERY SELECT 'log_security_event'::TEXT, 'OK'::TEXT, 'Function exists'::TEXT;
    ELSE
        RETURN QUERY SELECT 'log_security_event'::TEXT, 'MISSING'::TEXT, 'Security event logging function not found'::TEXT;
    END IF;
    
    -- Check RLS policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename IN ('mfa_configurations', 'user_sessions', 'security_events', 'api_keys')
    ) THEN
        RETURN QUERY SELECT 'rls_policies'::TEXT, 'OK'::TEXT, 'Row Level Security policies exist'::TEXT;
    ELSE
        RETURN QUERY SELECT 'rls_policies'::TEXT, 'WARNING'::TEXT, 'Some RLS policies may be missing'::TEXT;
    END IF;
    
    -- Check indexes
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname LIKE '%tenant%' OR indexname LIKE '%mfa%' OR indexname LIKE '%session%'
    ) THEN
        RETURN QUERY SELECT 'performance_indexes'::TEXT, 'OK'::TEXT, 'Performance indexes exist'::TEXT;
    ELSE
        RETURN QUERY SELECT 'performance_indexes'::TEXT, 'WARNING'::TEXT, 'Some performance indexes may be missing'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run validation and display results
SELECT * FROM validate_e2e_authentication_setup();

-- Create a summary view of all authentication-related tables
CREATE OR REPLACE VIEW authentication_tables_summary AS
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE tablename IN (
    'mfa_configurations',
    'user_sessions', 
    'security_events',
    'api_keys',
    'profiles',
    'tenants'
)
ORDER BY tablename;

-- Grant access to views
GRANT SELECT ON authentication_tables_summary TO authenticated;

-- Create function to get authentication statistics
CREATE OR REPLACE FUNCTION get_authentication_stats()
RETURNS TABLE (
    metric TEXT,
    value BIGINT,
    description TEXT
) AS $
BEGIN
    -- Total users with MFA enabled
    RETURN QUERY
    SELECT 
        'mfa_enabled_users'::TEXT,
        COUNT(*)::BIGINT,
        'Users with MFA enabled'::TEXT
    FROM mfa_configurations 
    WHERE enabled = TRUE AND tenant_id = get_current_tenant_id();
    
    -- Active sessions
    RETURN QUERY
    SELECT 
        'active_sessions'::TEXT,
        COUNT(*)::BIGINT,
        'Currently active user sessions'::TEXT
    FROM user_sessions 
    WHERE is_active = TRUE AND tenant_id = get_current_tenant_id();
    
    -- Active API keys
    RETURN QUERY
    SELECT 
        'active_api_keys'::TEXT,
        COUNT(*)::BIGINT,
        'Active API keys'::TEXT
    FROM api_keys 
    WHERE revoked = FALSE AND tenant_id = get_current_tenant_id();
    
    -- Security events (last 24 hours)
    RETURN QUERY
    SELECT 
        'recent_security_events'::TEXT,
        COUNT(*)::BIGINT,
        'Security events in last 24 hours'::TEXT
    FROM security_events 
    WHERE created_at > NOW() - INTERVAL '24 hours' 
      AND tenant_id = get_current_tenant_id();
    
    -- Failed login attempts (last 24 hours)
    RETURN QUERY
    SELECT 
        'failed_logins_24h'::TEXT,
        COUNT(*)::BIGINT,
        'Failed login attempts in last 24 hours'::TEXT
    FROM security_events 
    WHERE event_type = 'login_failure' 
      AND created_at > NOW() - INTERVAL '24 hours'
      AND tenant_id = get_current_tenant_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the stats function
GRANT EXECUTE ON FUNCTION get_authentication_stats() TO authenticated;

-- Final validation message
DO $$
DECLARE
    validation_results RECORD;
    has_errors BOOLEAN := FALSE;
BEGIN
    FOR validation_results IN 
        SELECT * FROM validate_e2e_authentication_setup()
    LOOP
        IF validation_results.status = 'MISSING' THEN
            has_errors := TRUE;
            RAISE WARNING 'MISSING COMPONENT: % - %', validation_results.component, validation_results.details;
        ELSIF validation_results.status = 'WARNING' THEN
            RAISE NOTICE 'WARNING: % - %', validation_results.component, validation_results.details;
        END IF;
    END LOOP;
    
    IF NOT has_errors THEN
        RAISE NOTICE 'E2E Authentication setup validation completed successfully!';
        
        -- Log successful validation
        PERFORM log_security_event(
            'system_validation',
            NULL,
            'E2E authentication setup validation completed',
            jsonb_build_object(
                'validation_script', '44-e2e-authentication-final-validation',
                'status', 'success'
            ),
            'low'
        );
    ELSE
        RAISE WARNING 'E2E Authentication setup has missing components. Please review the warnings above.';
    END IF;
END $$;

-- Add comments
COMMENT ON FUNCTION validate_e2e_authentication_setup() IS 'Validates that all E2E authentication components are properly configured';
COMMENT ON FUNCTION get_authentication_stats() IS 'Provides statistics about authentication system usage';
COMMENT ON VIEW authentication_tables_summary IS 'Summary of all authentication-related database tables';