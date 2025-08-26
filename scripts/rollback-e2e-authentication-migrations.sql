-- =====================================================
-- E2E AUTHENTICATION MIGRATIONS ROLLBACK
-- =====================================================
-- This script rolls back all E2E authentication migrations
-- WARNING: This will delete all authentication data!

-- Start transaction
BEGIN;

-- Log rollback start
DO $
BEGIN
    RAISE NOTICE 'Starting E2E Authentication migrations rollback...';
    RAISE WARNING 'This will delete all authentication data!';
END $;

-- Drop views first
DROP VIEW IF EXISTS user_auth_status CASCADE;
DROP VIEW IF EXISTS authentication_tables_summary CASCADE;
DROP VIEW IF EXISTS tenant_users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS validate_e2e_authentication_setup() CASCADE;
DROP FUNCTION IF EXISTS get_authentication_stats() CASCADE;
DROP FUNCTION IF EXISTS cleanup_authentication_data() CASCADE;
DROP FUNCTION IF EXISTS log_security_event(TEXT, UUID, TEXT, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_user_session(UUID, TEXT, TEXT, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_mfa_backup_code(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_mfa_backup_codes() CASCADE;
DROP FUNCTION IF EXISTS create_api_key_with_permissions(TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS validate_api_key_permissions(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS hash_api_key(TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_api_key_with_prefix() CASCADE;
DROP FUNCTION IF EXISTS get_user_active_sessions(UUID) CASCADE;
DROP FUNCTION IF EXISTS terminate_user_session(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_user_sessions() CASCADE;
DROP FUNCTION IF EXISTS log_tenant_violation(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS validate_tenant_access(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS enforce_tenant_isolation() CASCADE;
DROP FUNCTION IF EXISTS has_any_role(TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS get_current_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS enforce_tenant_isolation_security_events ON security_events;
DROP TRIGGER IF EXISTS enforce_tenant_isolation_mfa_configurations ON mfa_configurations;
DROP TRIGGER IF EXISTS enforce_tenant_isolation_user_sessions ON user_sessions;
DROP TRIGGER IF EXISTS enforce_tenant_isolation_api_keys ON api_keys;
DROP TRIGGER IF EXISTS enforce_tenant_isolation_assets ON assets;
DROP TRIGGER IF EXISTS enforce_tenant_isolation_profiles ON profiles;
DROP TRIGGER IF EXISTS update_mfa_configurations_updated_at ON mfa_configurations;

-- Remove columns added to existing tables
ALTER TABLE api_keys DROP COLUMN IF EXISTS permissions;
ALTER TABLE api_keys DROP COLUMN IF EXISTS key_hash;
ALTER TABLE api_keys DROP COLUMN IF EXISTS key_prefix;
ALTER TABLE api_keys DROP COLUMN IF EXISTS last_used_at;
ALTER TABLE api_keys DROP COLUMN IF EXISTS expires_at;
ALTER TABLE api_keys DROP COLUMN IF EXISTS revoked_at;
ALTER TABLE api_keys DROP COLUMN IF EXISTS revoked_reason;

-- Restore api_keys key column to NOT NULL if it was changed
-- ALTER TABLE api_keys ALTER COLUMN key SET NOT NULL;

-- Drop constraints
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS unique_api_key_hash;
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS valid_permissions_structure;

-- Drop new tables (in reverse dependency order)
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS mfa_configurations CASCADE;

-- Remove tenant_id column from profiles if it was added
-- ALTER TABLE profiles DROP COLUMN IF EXISTS tenant_id;

-- Drop indexes that were added
DROP INDEX IF EXISTS idx_profiles_tenant_id;
DROP INDEX IF EXISTS idx_api_keys_key_hash;
DROP INDEX IF EXISTS idx_api_keys_key_prefix;
DROP INDEX IF EXISTS idx_api_keys_last_used;
DROP INDEX IF EXISTS idx_api_keys_expires;
DROP INDEX IF EXISTS idx_api_keys_tenant_user_active;
DROP INDEX IF EXISTS idx_user_sessions_tenant_active;
DROP INDEX IF EXISTS idx_mfa_configurations_tenant_enabled;
DROP INDEX IF EXISTS idx_security_events_tenant_type_created;
DROP INDEX IF EXISTS idx_profiles_tenant_user;
DROP INDEX IF EXISTS idx_assets_tenant_created;
DROP INDEX IF EXISTS idx_api_keys_tenant_user;
DROP INDEX IF EXISTS idx_user_sessions_tenant_user;
DROP INDEX IF EXISTS idx_security_events_tenant_created;

-- Log completion
DO $
BEGIN
    RAISE NOTICE 'E2E Authentication migrations rollback completed!';
    RAISE NOTICE 'All authentication tables, functions, and data have been removed.';
END $;

-- Commit transaction
COMMIT;

-- Display final status
SELECT 'E2E Authentication Rollback Complete' as status,
       NOW() as completed_at;