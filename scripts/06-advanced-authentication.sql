-- =====================================================
-- ADVANCED AUTHENTICATION SYSTEM
-- =====================================================
-- Enhanced authentication features including MFA, SSO, session management, and API keys

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- MULTI-FACTOR AUTHENTICATION (MFA)
-- =====================================================

-- MFA methods table
CREATE TABLE IF NOT EXISTS mfa_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('totp', 'sms', 'email', 'backup_codes')),
    method_name VARCHAR(100) NOT NULL, -- User-friendly name
    secret_encrypted TEXT, -- Encrypted TOTP secret or phone/email
    backup_codes TEXT[], -- Encrypted backup codes
    is_verified BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    UNIQUE(tenant_id, user_id, method_type, method_name),
    CONSTRAINT valid_primary_method CHECK (
        NOT is_primary OR method_type IN ('totp', 'sms', 'email')
    )
);

-- MFA verification attempts
CREATE TABLE IF NOT EXISTS mfa_verification_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mfa_method_id UUID NOT NULL REFERENCES mfa_methods(id) ON DELETE CASCADE,
    attempt_type VARCHAR(20) NOT NULL CHECK (attempt_type IN ('login', 'setup', 'recovery')),
    code_hash TEXT, -- Hashed verification code
    ip_address INET,
    user_agent TEXT,
    is_successful BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- =====================================================
-- SINGLE SIGN-ON (SSO) INTEGRATION
-- =====================================================

-- SSO providers configuration
CREATE TABLE IF NOT EXISTS sso_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('saml2', 'oauth2', 'oidc')),
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- Provider configuration (encrypted)
    configuration JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    entity_id VARCHAR(255), -- SAML Entity ID
    sso_url TEXT, -- SSO endpoint URL
    slo_url TEXT, -- Single Logout URL
    certificate TEXT, -- X.509 certificate for SAML
    
    -- OAuth/OIDC specific
    client_id VARCHAR(255),
    client_secret_encrypted TEXT,
    authorization_url TEXT,
    token_url TEXT,
    userinfo_url TEXT,
    jwks_url TEXT,
    
    -- Attribute mapping
    attribute_mapping JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, provider_name)
);

-- SSO authentication sessions
CREATE TABLE IF NOT EXISTS sso_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
    
    -- Session identifiers
    saml_session_id VARCHAR(255), -- SAML SessionIndex
    oauth_state VARCHAR(255), -- OAuth state parameter
    
    -- Session data
    attributes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    terminated_at TIMESTAMPTZ
);

-- =====================================================
-- SESSION MANAGEMENT
-- =====================================================

-- Enhanced user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session identification
    session_token_hash TEXT NOT NULL UNIQUE,
    refresh_token_hash TEXT UNIQUE,
    
    -- Session metadata
    device_fingerprint TEXT,
    device_name VARCHAR(255),
    device_type VARCHAR(50) CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'api')),
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    
    -- Location and network
    ip_address INET NOT NULL,
    country_code CHAR(2),
    city VARCHAR(100),
    user_agent TEXT,
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    terminated_at TIMESTAMPTZ,
    termination_reason VARCHAR(50) CHECK (
        termination_reason IN ('logout', 'timeout', 'admin_revoke', 'security_revoke', 'concurrent_limit')
    )
);

-- Session activity log
CREATE TABLE IF NOT EXISTS session_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(50) NOT NULL CHECK (
        activity_type IN ('login', 'logout', 'api_call', 'page_view', 'action', 'security_event')
    ),
    activity_details JSONB DEFAULT '{}',
    
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- API KEY MANAGEMENT
-- =====================================================

-- API keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Key identification
    key_name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification
    key_hash TEXT NOT NULL UNIQUE, -- Hashed full key
    
    -- Permissions and scope
    permissions JSONB DEFAULT '{}', -- Granular permissions
    scopes TEXT[] DEFAULT '{}', -- API scopes
    allowed_ips INET[] DEFAULT '{}', -- IP restrictions
    
    -- Rate limiting
    rate_limit_requests INTEGER DEFAULT 1000, -- Requests per window
    rate_limit_window_seconds INTEGER DEFAULT 3600, -- Window size in seconds
    
    -- Status and lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL for no expiration
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    UNIQUE(tenant_id, user_id, key_name)
);

-- API key usage tracking
CREATE TABLE IF NOT EXISTS api_key_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    
    -- Request details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    request_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(api_key_id, window_start)
);

-- =====================================================
-- SECURITY EVENTS AND AUDIT
-- =====================================================

-- Security events
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN (
            'login_success', 'login_failure', 'mfa_success', 'mfa_failure',
            'password_change', 'account_locked', 'account_unlocked',
            'suspicious_activity', 'api_key_created', 'api_key_revoked',
            'session_terminated', 'concurrent_session_limit'
        )
    ),
    
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    location_country CHAR(2),
    location_city VARCHAR(100),
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- MFA indexes
CREATE INDEX IF NOT EXISTS idx_mfa_methods_tenant_user ON mfa_methods(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_methods_type ON mfa_methods(method_type) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_mfa_verification_attempts_user ON mfa_verification_attempts(tenant_id, user_id, created_at);

-- SSO indexes
CREATE INDEX IF NOT EXISTS idx_sso_providers_tenant ON sso_providers(tenant_id) WHERE is_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON sso_sessions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_expires ON sso_sessions(expires_at) WHERE terminated_at IS NULL;

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_session_activities_session ON session_activities(session_id, created_at);

-- API key indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_user ON api_keys(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at) WHERE is_active = TRUE AND expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key ON api_key_usage(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_key_window ON rate_limit_buckets(api_key_id, window_start);

-- Security event indexes
CREATE INDEX IF NOT EXISTS idx_security_events_tenant ON security_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity, created_at) WHERE is_resolved = FALSE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE mfa_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- MFA methods policies
CREATE POLICY "mfa_methods_tenant_isolation" ON mfa_methods
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "mfa_methods_user_access" ON mfa_methods
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID AND
        (user_id = auth.uid() OR current_setting('app.current_user_role') IN ('admin', 'owner'))
    );

-- MFA verification attempts policies
CREATE POLICY "mfa_verification_tenant_isolation" ON mfa_verification_attempts
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "mfa_verification_user_access" ON mfa_verification_attempts
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID AND
        (user_id = auth.uid() OR current_setting('app.current_user_role') IN ('admin', 'owner'))
    );

-- SSO providers policies (admin only)
CREATE POLICY "sso_providers_admin_only" ON sso_providers
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID AND
        current_setting('app.current_user_role') IN ('admin', 'owner')
    );

-- SSO sessions policies
CREATE POLICY "sso_sessions_tenant_isolation" ON sso_sessions
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "sso_sessions_user_access" ON sso_sessions
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID AND
        (user_id = auth.uid() OR current_setting('app.current_user_role') IN ('admin', 'owner'))
    );

-- User sessions policies
CREATE POLICY "user_sessions_tenant_isolation" ON user_sessions
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "user_sessions_user_access" ON user_sessions
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID AND
        (user_id = auth.uid() OR current_setting('app.current_user_role') IN ('admin', 'owner'))
    );

-- Session activities policies
CREATE POLICY "session_activities_tenant_isolation" ON session_activities
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- API keys policies
CREATE POLICY "api_keys_tenant_isolation" ON api_keys
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "api_keys_user_access" ON api_keys
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID AND
        (user_id = auth.uid() OR current_setting('app.current_user_role') IN ('admin', 'owner'))
    );

-- API key usage policies
CREATE POLICY "api_key_usage_tenant_isolation" ON api_key_usage
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Rate limit buckets policies
CREATE POLICY "rate_limit_buckets_tenant_isolation" ON rate_limit_buckets
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Security events policies
CREATE POLICY "security_events_tenant_isolation" ON security_events
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "security_events_user_access" ON security_events
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID AND
        (user_id = auth.uid() OR current_setting('app.current_user_role') IN ('admin', 'owner'))
    );

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE user_sessions 
    SET is_active = FALSE, 
        terminated_at = NOW(),
        termination_reason = 'timeout'
    WHERE is_active = TRUE 
      AND (expires_at < NOW() OR last_activity_at < NOW() - INTERVAL '24 hours');
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Clean up old session activities (keep last 90 days)
    DELETE FROM session_activities 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old MFA verification attempts (keep last 30 days)
    DELETE FROM mfa_verification_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old rate limit buckets (keep last 7 days)
    DELETE FROM rate_limit_buckets 
    WHERE window_end < NOW() - INTERVAL '7 days';
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check concurrent session limits
CREATE OR REPLACE FUNCTION check_concurrent_session_limit(
    p_tenant_id UUID,
    p_user_id UUID,
    p_max_sessions INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
    active_sessions INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_sessions
    FROM user_sessions
    WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
      AND is_active = TRUE
      AND expires_at > NOW();
    
    RETURN active_sessions < p_max_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ak_' || encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_mfa_methods_updated_at
    BEFORE UPDATE ON mfa_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_providers_updated_at
    BEFORE UPDATE ON sso_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_buckets_updated_at
    BEFORE UPDATE ON rate_limit_buckets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Security event trigger for failed login attempts
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called by application logic
    -- Placeholder for security event logging
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert default MFA settings for existing tenants
INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, setting_type)
SELECT 
    id as tenant_id,
    'mfa_required' as setting_key,
    'false' as setting_value,
    'boolean' as setting_type
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_settings 
    WHERE tenant_id = tenants.id AND setting_key = 'mfa_required'
);

INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, setting_type)
SELECT 
    id as tenant_id,
    'max_concurrent_sessions' as setting_key,
    '5' as setting_value,
    'integer' as setting_type
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_settings 
    WHERE tenant_id = tenants.id AND setting_key = 'max_concurrent_sessions'
);

INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, setting_type)
SELECT 
    id as tenant_id,
    'session_timeout_hours' as setting_key,
    '8' as setting_value,
    'integer' as setting_type
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_settings 
    WHERE tenant_id = tenants.id AND setting_key = 'session_timeout_hours'
);

-- Create indexes for tenant settings
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_key ON tenant_settings(tenant_id, setting_key);

COMMENT ON TABLE mfa_methods IS 'Multi-factor authentication methods for users';
COMMENT ON TABLE sso_providers IS 'Single sign-on provider configurations';
COMMENT ON TABLE user_sessions IS 'Enhanced user session management with device tracking';
COMMENT ON TABLE api_keys IS 'API key management with granular permissions';
COMMENT ON TABLE security_events IS 'Security event logging and monitoring';