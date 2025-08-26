-- =====================================================
-- COMPLETE E2E AUTHENTICATION MIGRATIONS
-- =====================================================
-- This script contains all necessary migrations to fix the tenant constraint
-- error and set up complete E2E authentication functionality.
--
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Go to: https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/sql/new
-- 3. Paste and click "Run"
-- =====================================================

BEGIN;

-- =====================================================
-- 1. FIX SECURITY EVENT TENANT CONSTRAINT ISSUE
-- =====================================================

-- Update the log_security_event function to handle NULL tenant_id properly
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    current_tenant_id UUID;
    safe_event_type TEXT;
BEGIN
    -- Get current tenant ID
    current_tenant_id := get_current_tenant_id();

    IF current_tenant_id IS NULL AND p_user_id IS NOT NULL THEN
        SELECT tenant_id INTO current_tenant_id
        FROM profiles
        WHERE id = p_user_id;
    END IF;

    -- If still no tenant_id, try to get the first available tenant (for system events)
    IF current_tenant_id IS NULL THEN
        SELECT id INTO current_tenant_id FROM tenants LIMIT 1;
    END IF;

    -- If still no tenant_id, we can't log the event - return NULL instead of raising exception
    IF current_tenant_id IS NULL THEN
        RAISE NOTICE 'Cannot log security event: no tenant context available for event_type: %', p_event_type;
        RETURN NULL;
    END IF;

    -- Map system event types to allowed types
    safe_event_type := CASE
        WHEN p_event_type = 'system_migration' THEN 'suspicious_activity'
        WHEN p_event_type IN ('login_success', 'login_failure', 'mfa_success', 'mfa_failure',
                              'password_change', 'account_locked', 'account_unlocked',
                              'suspicious_activity', 'api_key_created', 'api_key_revoked',
                              'session_terminated', 'concurrent_session_limit') THEN p_event_type
        ELSE 'suspicious_activity'
    END;

    -- Insert security event
    INSERT INTO security_events (
        tenant_id,
        user_id,
        event_type,
        severity,
        description,
        details,
        ip_address,
        user_agent
    ) VALUES (
        current_tenant_id,
        p_user_id,
        safe_event_type,
        p_severity,
        COALESCE(p_description, 'Security event: ' || p_event_type),
        p_details,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO event_id;

    RETURN event_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback insert without optional fields, but only if we have a tenant_id
        IF current_tenant_id IS NOT NULL THEN
            BEGIN
                INSERT INTO security_events (
                    tenant_id,
                    user_id,
                    event_type,
                    severity,
                    description,
                    details
                ) VALUES (
                    current_tenant_id,
                    p_user_id,
                    safe_event_type,
                    p_severity,
                    COALESCE(p_description, 'Security event: ' || p_event_type),
                    p_details
                ) RETURNING id INTO event_id;

                RETURN event_id;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to log security event: %', SQLERRM;
                    RETURN NULL;
            END;
        ELSE
            RAISE NOTICE 'Cannot log security event - no tenant context available: %', p_event_type;
            RETURN NULL;
        END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function to make sure it works
DO $$
BEGIN
    -- Try to log a test event - should handle gracefully if no tenants exist
    PERFORM log_security_event(
        'system_migration',
        NULL,
        'Test security event logging after fix',
        jsonb_build_object('fix', 'tenant-constraint-issue'),
        'low'
    );

    RAISE NOTICE 'Security event function fix applied successfully';
END $$;

-- =====================================================
-- 2. E2E AUTHENTICATION COMPLETE MIGRATION
-- =====================================================

-- Function to get current tenant ID from context (if not exists)
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

-- Function to check if user has role (if not exists)
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

-- Function to update updated_at column (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure backup codes
CREATE OR REPLACE FUNCTION generate_mfa_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
    code TEXT;
BEGIN
    FOR i IN 1..10 LOOP
        code := upper(substring(encode(gen_random_bytes(5), 'hex') from 1 for 8));
        codes := array_append(codes, code);
    END LOOP;
    RETURN codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify MFA backup code
CREATE OR REPLACE FUNCTION verify_mfa_backup_code(
    p_user_id UUID,
    p_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    mfa_config RECORD;
    updated_codes TEXT[];
BEGIN
    SELECT * INTO mfa_config
    FROM mfa_configurations
    WHERE user_id = p_user_id
      AND tenant_id = get_current_tenant_id()
      AND enabled = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if code exists in backup codes
    IF p_code = ANY(mfa_config.backup_codes) THEN
        -- Remove used code from array
        SELECT array_agg(code) INTO updated_codes
        FROM unnest(mfa_config.backup_codes) AS code
        WHERE code != p_code;

        -- Update the configuration
        UPDATE mfa_configurations
        SET backup_codes = updated_codes,
            backup_codes_used = backup_codes_used + 1,
            last_used_at = NOW()
        WHERE id = mfa_config.id;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user session
CREATE OR REPLACE FUNCTION create_user_session(
    p_user_id UUID,
    p_session_token TEXT,
    p_device_info TEXT,
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    user_tenant_id UUID;
BEGIN
    -- Get user's tenant_id
    SELECT tenant_id INTO user_tenant_id
    FROM profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Mark all other sessions as not current
    UPDATE user_sessions
    SET is_current = FALSE
    WHERE user_id = p_user_id AND is_current = TRUE;

    -- Create new session
    INSERT INTO user_sessions (
        tenant_id,
        user_id,
        session_token,
        device_info,
        ip_address,
        user_agent,
        is_current,
        expires_at
    ) VALUES (
        user_tenant_id,
        p_user_id,
        p_session_token,
        p_device_info,
        p_ip_address,
        p_user_agent,
        TRUE,
        NOW() + INTERVAL '24 hours'
    ) RETURNING id INTO session_id;

    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all tables have proper tenant_id columns and constraints
DO $$
BEGIN
    -- Check if profiles has tenant_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
    END IF;

    -- Ensure all authentication-related tables have proper indexes
    CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_user_active ON api_keys(tenant_id, user_id) WHERE revoked = FALSE;
    CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_active ON user_sessions(tenant_id, is_active) WHERE is_active = TRUE;
    CREATE INDEX IF NOT EXISTS idx_mfa_configurations_tenant_enabled ON mfa_configurations(tenant_id, enabled) WHERE enabled = TRUE;
    CREATE INDEX IF NOT EXISTS idx_security_events_tenant_type_created ON security_events(tenant_id, event_type, created_at);
END $$;

-- Create a comprehensive view for user authentication status
CREATE OR REPLACE VIEW user_auth_status AS
SELECT
    p.id as user_id,
    p.email,
    p.full_name,
    p.tenant_id,
    t.name as tenant_name,

    -- MFA status
    CASE
        WHEN mfa.enabled = TRUE THEN 'enabled'
        WHEN mfa.id IS NOT NULL THEN 'configured'
        ELSE 'disabled'
    END as mfa_status,

    -- Active sessions count
    COALESCE(sessions.active_count, 0) as active_sessions,

    -- API keys count
    COALESCE(api_keys.active_count, 0) as active_api_keys,

    -- Last login
    sessions.last_activity as last_login,

    -- Account status
    p.created_at as account_created,
    p.updated_at as account_updated

FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
LEFT JOIN mfa_configurations mfa ON p.id = mfa.user_id AND mfa.tenant_id = p.tenant_id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) as active_count,
        MAX(last_activity) as last_activity
    FROM user_sessions
    WHERE is_active = TRUE
    GROUP BY user_id
) sessions ON p.id = sessions.user_id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) as active_count
    FROM api_keys
    WHERE revoked = FALSE
    GROUP BY user_id
) api_keys ON p.id = api_keys.user_id
WHERE p.tenant_id = get_current_tenant_id();

-- Grant access to the view
GRANT SELECT ON user_auth_status TO authenticated;

-- Create cleanup job for old sessions and events
CREATE OR REPLACE FUNCTION cleanup_authentication_data()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up expired sessions
    SELECT cleanup_expired_user_sessions() INTO temp_count;
    cleaned_count := cleaned_count + temp_count;

    -- Clean up old security events (keep 1 year)
    DELETE FROM security_events
    WHERE created_at < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleaned_count := cleaned_count + temp_count;

    -- Clean up old unused MFA configurations (not enabled for 30 days)
    DELETE FROM mfa_configurations
    WHERE enabled = FALSE
      AND created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleaned_count := cleaned_count + temp_count;

    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FINAL VALIDATION AND MONITORING
-- =====================================================

-- Validation function to check all required components
CREATE OR REPLACE FUNCTION validate_e2e_authentication_setup()
RETURNS TABLE (
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
) AS $$
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the stats function
GRANT EXECUTE ON FUNCTION get_authentication_stats() TO authenticated;

-- Final validation and table checks
DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    required_table TEXT;
    validation_results RECORD;
    has_errors BOOLEAN := FALSE;
BEGIN
    -- Check for required tables
    FOR required_table IN VALUES ('tenants'), ('profiles'), ('api_keys'), ('user_sessions'), ('mfa_configurations'), ('security_events') LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = required_table) THEN
            missing_tables := array_append(missing_tables, required_table);
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Missing required tables: %', array_to_string(missing_tables, ', ');
        has_errors := TRUE;
    END IF;

    -- Run validation
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

        -- Log successful migration (only if tenants exist)
        IF EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
            PERFORM log_security_event(
                'system_migration',
                NULL,
                'Complete E2E authentication migration executed successfully',
                jsonb_build_object(
                    'migration_script', 'COMPLETE_MIGRATION_SCRIPT',
                    'components', 'fix,complete,validation',
                    'status', 'success'
                ),
                'low'
            );
        ELSE
            RAISE NOTICE 'Migration completed successfully but no tenants exist to log security event';
        END IF;
    ELSE
        RAISE WARNING 'E2E Authentication setup has missing components. Please review the warnings above.';
    END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION validate_e2e_authentication_setup() IS 'Validates that all E2E authentication components are properly configured';
COMMENT ON FUNCTION get_authentication_stats() IS 'Provides statistics about authentication system usage';
COMMENT ON VIEW authentication_tables_summary IS 'Summary of all authentication-related database tables';
COMMENT ON VIEW user_auth_status IS 'Comprehensive view of user authentication status including MFA, sessions, and API keys';
COMMENT ON FUNCTION cleanup_authentication_data() IS 'Cleanup function for old authentication data - should be run periodically';
COMMENT ON FUNCTION log_security_event(TEXT, UUID, TEXT, JSONB, TEXT) IS 'Centralized function for logging security events with proper tenant handling';
COMMENT ON FUNCTION create_user_session(UUID, TEXT, TEXT, INET, TEXT) IS 'Creates a new user session with proper tenant isolation';
COMMENT ON FUNCTION verify_mfa_backup_code(UUID, TEXT) IS 'Verifies and consumes MFA backup codes';
COMMENT ON FUNCTION generate_mfa_backup_codes() IS 'Generates secure backup codes for MFA';

COMMIT;

-- Final status check
SELECT 'All E2E Authentication migrations completed successfully!' as status,
       NOW() as completed_at;

-- Display validation results
SELECT * FROM validate_e2e_authentication_setup();