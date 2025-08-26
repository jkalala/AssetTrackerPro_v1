-- =====================================================
-- E2E AUTHENTICATION MIGRATIONS RUNNER
-- =====================================================
-- This script runs all E2E authentication migrations in the correct order
-- Run this script to set up all authentication functionality for E2E tests

-- Start transaction
BEGIN;

-- Log migration start
DO $$
BEGIN
    RAISE NOTICE 'Starting E2E Authentication migrations...';
END $$;

-- 1. MFA Configuration (if not already run)
\echo 'Running MFA configuration migration...'
\i scripts/39-add-mfa-configuration.sql

-- 2. Security Events Table
\echo 'Running security events table migration...'
\i scripts/38-create-security-events-table.sql

-- 3. Session Tracking
\echo 'Running session tracking migration...'
\i scripts/40-create-session-tracking.sql

-- 4. API Keys Permissions
\echo 'Running API keys permissions migration...'
\i scripts/41-update-api-keys-permissions.sql

-- 5. Tenant Isolation Constraints
\echo 'Running tenant isolation constraints migration...'
\i scripts/42-add-tenant-isolation-constraints.sql

-- 6. Complete Migration Integration
\echo 'Running complete migration integration...'
\i scripts/43-e2e-authentication-complete-migration.sql

-- 7. Final Validation
\echo 'Running final validation...'
\i scripts/44-e2e-authentication-final-validation.sql

-- 8. Run Tests
\echo 'Running migration tests...'
\i scripts/test-e2e-authentication-migrations.sql

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'E2E Authentication migrations completed successfully!';
    RAISE NOTICE 'You can now run the E2E tests - all required database components are in place.';
END $$;

-- Commit transaction
COMMIT;

-- Display final status
SELECT 'E2E Authentication Database Setup Complete' as status,
       NOW() as completed_at;