-- =====================================================
-- SECURITY EVENTS TABLE CREATION
-- =====================================================
-- This script creates the security_events table for logging security-related events

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

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id UUID,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success',
        'login_failure', 
        'mfa_success',
        'mfa_failure',
        'password_change',
        'account_locked',
        'account_unlocked',
        'suspicious_activity',
        'api_key_created',
        'api_key_revoked',
        'session_terminated',
        'concurrent_session_limit'
    )),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    location_country TEXT,
    location_city TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_id ON security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_is_resolved ON security_events(is_resolved);

-- Enable Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admin users can see all security events for their tenant
CREATE POLICY "Admin users can view all security events" ON security_events
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND
        has_any_role(ARRAY['admin', 'owner'])
    );

-- Admin users can insert security events
CREATE POLICY "Admin users can insert security events" ON security_events
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id() AND
        has_any_role(ARRAY['admin', 'owner'])
    );

-- Admin users can update security events (for resolution)
CREATE POLICY "Admin users can update security events" ON security_events
    FOR UPDATE USING (
        tenant_id = get_current_tenant_id() AND
        has_any_role(ARRAY['admin', 'owner'])
    );

-- System can insert security events (for automated logging)
CREATE POLICY "System can insert security events" ON security_events
    FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON security_events TO authenticated;

-- Add comment
COMMENT ON TABLE security_events IS 'Security events and audit trail for monitoring system security';