-- =====================================================
-- API KEYS PERMISSIONS MIGRATION
-- =====================================================
-- This script updates the API keys table to add permissions column and enhance functionality

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

-- Add permissions column to existing api_keys table
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"assets": {"read": true, "write": false}}';

-- Add key_hash column for secure storage (replace plain text key)
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS key_hash TEXT;

-- Add key_prefix column for identification
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS key_prefix TEXT;

-- Add additional metadata columns
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

-- Update the key column to be nullable (we'll use key_hash instead)
ALTER TABLE api_keys 
ALTER COLUMN key DROP NOT NULL;

-- Add new indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash) WHERE revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Add constraint for permissions structure
ALTER TABLE api_keys 
ADD CONSTRAINT valid_permissions_structure 
CHECK (
    permissions ? 'assets' AND 
    (permissions->'assets') ? 'read' AND 
    (permissions->'assets') ? 'write'
);

-- Function to generate API key with proper format
CREATE OR REPLACE FUNCTION generate_api_key_with_prefix()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ak_' || encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash API key
CREATE OR REPLACE FUNCTION hash_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(api_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate API key permissions
CREATE OR REPLACE FUNCTION validate_api_key_permissions(
    p_key_hash TEXT,
    p_resource TEXT,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    key_permissions JSONB;
BEGIN
    SELECT permissions INTO key_permissions
    FROM api_keys
    WHERE key_hash = p_key_hash
      AND revoked = FALSE
      AND tenant_id = get_current_tenant_id()
      AND (expires_at IS NULL OR expires_at > NOW());
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update last_used_at
    UPDATE api_keys 
    SET last_used_at = NOW()
    WHERE key_hash = p_key_hash;
    
    -- Check permissions
    RETURN COALESCE(
        (key_permissions -> p_resource ->> p_action)::BOOLEAN,
        FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create API key with permissions
CREATE OR REPLACE FUNCTION create_api_key_with_permissions(
    p_name TEXT,
    p_permissions JSONB DEFAULT '{"assets": {"read": true, "write": false}}'
)
RETURNS TABLE (
    api_key_id UUID,
    api_key TEXT,
    key_prefix TEXT
) AS $$
DECLARE
    new_key TEXT;
    new_key_hash TEXT;
    new_key_prefix TEXT;
    new_id UUID;
BEGIN
    -- Generate new API key
    new_key := generate_api_key_with_prefix();
    new_key_hash := hash_api_key(new_key);
    new_key_prefix := substring(new_key from 1 for 12) || '...';
    
    -- Insert new API key
    INSERT INTO api_keys (
        tenant_id,
        user_id,
        name,
        key_hash,
        key_prefix,
        permissions,
        created_at
    ) VALUES (
        get_current_tenant_id(),
        auth.uid(),
        p_name,
        new_key_hash,
        new_key_prefix,
        p_permissions,
        NOW()
    ) RETURNING id INTO new_id;
    
    -- Return the key details (only time the plain key is returned)
    RETURN QUERY SELECT new_id, new_key, new_key_prefix;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing API keys to use hash format
DO $$
DECLARE
    api_key_record RECORD;
    new_key TEXT;
    new_hash TEXT;
    new_prefix TEXT;
BEGIN
    FOR api_key_record IN 
        SELECT id, key FROM api_keys WHERE key_hash IS NULL AND key IS NOT NULL
    LOOP
        -- Generate hash for existing key
        new_hash := hash_api_key(api_key_record.key);
        new_prefix := substring(api_key_record.key from 1 for 12) || '...';
        
        -- Update the record
        UPDATE api_keys 
        SET 
            key_hash = new_hash,
            key_prefix = new_prefix,
            key = NULL -- Remove plain text key for security
        WHERE id = api_key_record.id;
    END LOOP;
END $$;

-- Add unique constraint on key_hash
ALTER TABLE api_keys 
ADD CONSTRAINT unique_api_key_hash UNIQUE (key_hash);

-- Drop the old unique constraint on key column
ALTER TABLE api_keys 
DROP CONSTRAINT IF EXISTS api_keys_key_key;

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "api_keys_tenant_isolation" ON api_keys;
DROP POLICY IF EXISTS "api_keys_user_access" ON api_keys;

-- Recreate RLS policies
CREATE POLICY "api_keys_tenant_isolation" ON api_keys
    FOR ALL USING (
        tenant_id = get_current_tenant_id()
    );

CREATE POLICY "api_keys_user_access" ON api_keys
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND
        (user_id = auth.uid() OR has_any_role(ARRAY['admin', 'owner']))
    );

-- Add comment
COMMENT ON COLUMN api_keys.permissions IS 'JSONB object defining granular permissions for API key';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA256 hash of the API key for secure storage';
COMMENT ON COLUMN api_keys.key_prefix IS 'First few characters of API key for identification';