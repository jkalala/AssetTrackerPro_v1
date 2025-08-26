-- =====================================================
-- MFA CONFIGURATION MIGRATION
-- =====================================================
-- This script adds MFA configuration table and fields for multi-factor authentication

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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create MFA configuration table
CREATE TABLE IF NOT EXISTS mfa_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- TOTP configuration
    secret TEXT NOT NULL, -- Base32 encoded TOTP secret
    enabled BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    -- Backup codes (encrypted)
    backup_codes TEXT[], -- Array of encrypted backup codes
    backup_codes_used INTEGER DEFAULT 0,
    
    -- Metadata
    qr_code_url TEXT, -- URL for QR code generation
    issuer TEXT DEFAULT 'AssetPro',
    account_name TEXT, -- Usually user email
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(tenant_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mfa_configurations_tenant_id ON mfa_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mfa_configurations_user_id ON mfa_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_configurations_enabled ON mfa_configurations(enabled) WHERE enabled = TRUE;

-- Enable Row Level Security
ALTER TABLE mfa_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "mfa_configurations_tenant_isolation" ON mfa_configurations
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
    );

-- Users can only access their own MFA configuration
CREATE POLICY "mfa_configurations_user_access" ON mfa_configurations
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND
        (user_id = auth.uid() OR has_any_role(ARRAY['admin', 'owner']))
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_configurations TO authenticated;

-- Add trigger for updated_at
CREATE TRIGGER update_mfa_configurations_updated_at
    BEFORE UPDATE ON mfa_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE mfa_configurations IS 'Multi-factor authentication configuration for users';