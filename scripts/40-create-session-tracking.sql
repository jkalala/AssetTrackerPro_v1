-- =====================================================
-- SESSION TRACKING MIGRATION
-- =====================================================
-- This script creates session tracking table for managing user sessions

-- Ensure required functions exist
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

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Session identification
    session_token TEXT NOT NULL UNIQUE, -- Session identifier
    device_info TEXT, -- Device information
    ip_address INET NOT NULL,
    user_agent TEXT,
    
    -- Session metadata
    browser_name TEXT,
    browser_version TEXT,
    os_name TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    
    -- Location data
    country TEXT,
    city TEXT,
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    is_current BOOLEAN DEFAULT FALSE, -- Marks the current session
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    terminated_at TIMESTAMPTZ,
    
    -- Termination details
    termination_reason TEXT CHECK (
        termination_reason IN ('logout', 'timeout', 'admin_revoke', 'security_revoke', 'concurrent_limit')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_id ON user_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_current ON user_sessions(user_id, is_current) WHERE is_current = TRUE;

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "user_sessions_tenant_isolation" ON user_sessions
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
    );

-- Users can only access their own sessions, admins can see all
CREATE POLICY "user_sessions_user_access" ON user_sessions
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND
        (user_id = auth.uid() OR has_any_role(ARRAY['admin', 'owner']))
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_user_sessions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mark expired sessions as inactive
    UPDATE user_sessions 
    SET is_active = FALSE, 
        terminated_at = NOW(),
        termination_reason = 'timeout'
    WHERE is_active = TRUE 
      AND (expires_at < NOW() OR last_activity < NOW() - INTERVAL '24 hours');
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Clean up old inactive sessions (keep last 90 days)
    DELETE FROM user_sessions 
    WHERE is_active = FALSE 
      AND terminated_at < NOW() - INTERVAL '90 days';
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to terminate user session
CREATE OR REPLACE FUNCTION terminate_user_session(
    p_session_id UUID,
    p_reason TEXT DEFAULT 'logout'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_sessions 
    SET is_active = FALSE,
        terminated_at = NOW(),
        termination_reason = p_reason
    WHERE id = p_session_id
      AND tenant_id = get_current_tenant_id()
      AND is_active = TRUE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active sessions for a user
CREATE OR REPLACE FUNCTION get_user_active_sessions(p_user_id UUID)
RETURNS TABLE (
    session_id UUID,
    device_info TEXT,
    ip_address INET,
    browser_name TEXT,
    os_name TEXT,
    device_type TEXT,
    country TEXT,
    city TEXT,
    is_current BOOLEAN,
    created_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.device_info,
        us.ip_address,
        us.browser_name,
        us.os_name,
        us.device_type,
        us.country,
        us.city,
        us.is_current,
        us.created_at,
        us.last_activity
    FROM user_sessions us
    WHERE us.user_id = p_user_id
      AND us.tenant_id = get_current_tenant_id()
      AND us.is_active = TRUE
    ORDER BY us.last_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE user_sessions IS 'User session tracking for security and management';