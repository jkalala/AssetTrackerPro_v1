# E2E Authentication Database Migrations

This directory contains all the database migrations required for the E2E authentication functionality.

## Migration Files

### Core Migrations

1. **39-add-mfa-configuration.sql** - Creates MFA configuration table and fields
   - `mfa_configurations` table with TOTP secrets, backup codes, and metadata
   - RLS policies for tenant isolation
   - Functions for MFA management

2. **38-create-security-events-table.sql** - Creates security events logging table
   - `security_events` table for audit trail and security monitoring
   - Event types: login_success, login_failure, mfa_success, etc.
   - RLS policies and performance indexes

3. **40-create-session-tracking.sql** - Creates session tracking table
   - `user_sessions` table for managing user sessions
   - Session metadata, device info, and location tracking
   - Functions for session management and cleanup

4. **41-update-api-keys-permissions.sql** - Updates API keys table with permissions
   - Adds `permissions` JSONB column to `api_keys` table
   - Implements secure API key hashing with "ak_" prefix
   - Functions for API key generation and validation

5. **42-add-tenant-isolation-constraints.sql** - Adds tenant isolation constraints
   - Ensures all tables have proper tenant_id foreign keys
   - Creates tenant isolation triggers and functions
   - Enhanced RLS policies for strict tenant separation

### Integration and Validation

6. **43-e2e-authentication-complete-migration.sql** - Complete integration
   - Integrates all authentication components
   - Creates helper functions and views
   - Ensures all components work together

7. **44-e2e-authentication-final-validation.sql** - Final validation
   - Validates all components are properly configured
   - Provides authentication statistics and monitoring
   - Creates validation functions for ongoing health checks

## Running the Migrations

### Option 1: Run All Migrations at Once (Recommended)
```sql
\i scripts/run-e2e-authentication-migrations.sql
```

This will run all migrations in the correct order and include validation tests.

### Option 2: Run Individual Migrations
Run the migrations in this order:
```sql
\i scripts/39-add-mfa-configuration.sql
\i scripts/38-create-security-events-table.sql
\i scripts/40-create-session-tracking.sql
\i scripts/41-update-api-keys-permissions.sql
\i scripts/42-add-tenant-isolation-constraints.sql
\i scripts/43-e2e-authentication-complete-migration.sql
\i scripts/44-e2e-authentication-final-validation.sql
```

## Database Tables Created

### mfa_configurations
- Stores TOTP secrets and backup codes for users
- Tracks MFA enablement status and usage

### user_sessions
- Tracks active user sessions across devices
- Stores device information and location data
- Supports session termination and cleanup

### security_events
- Logs all security-related events
- Supports filtering and monitoring
- Includes event severity and resolution tracking

### Enhanced api_keys
- Adds granular permissions (assets read/write)
- Secure key hashing and prefix identification
- Usage tracking and expiration support

## Key Functions Created

### MFA Functions
- `generate_mfa_backup_codes()` - Generates secure backup codes
- `verify_mfa_backup_code(user_id, code)` - Verifies backup codes

### Session Functions
- `create_user_session(...)` - Creates new user sessions
- `cleanup_expired_user_sessions()` - Cleans up old sessions
- `terminate_user_session(session_id, reason)` - Terminates sessions

### Security Functions
- `log_security_event(...)` - Logs security events
- `validate_tenant_access(...)` - Validates tenant access
- `get_current_tenant_id()` - Gets current tenant context

### API Key Functions
- `generate_api_key_with_prefix()` - Generates "ak_" prefixed keys
- `hash_api_key(key)` - Securely hashes API keys
- `validate_api_key_permissions(...)` - Validates key permissions

## Validation

After running migrations, use these queries to validate setup:

```sql
-- Check all components
SELECT * FROM validate_e2e_authentication_setup();

-- Get authentication statistics
SELECT * FROM get_authentication_stats();

-- View table summary
SELECT * FROM authentication_tables_summary;

-- Check user authentication status
SELECT * FROM user_auth_status LIMIT 5;
```

## Requirements Satisfied

This migration setup satisfies the following requirements:

- **Requirement 1.6**: API keys with granular permissions
- **Requirement 2.6**: MFA configuration and backup codes
- **Requirement 3.6**: Session tracking and management
- **Requirement 6.6**: Security event logging and monitoring
- **Requirement 7.6**: Tenant isolation and constraints

## Security Features

- **Row Level Security (RLS)**: All tables have tenant isolation
- **Secure Storage**: API keys are hashed, MFA secrets encrypted
- **Audit Trail**: All security events are logged
- **Session Security**: Device tracking and session management
- **Tenant Isolation**: Strict separation of tenant data

## Maintenance

The migrations include cleanup functions that should be run periodically:

```sql
-- Clean up old sessions and events
SELECT cleanup_authentication_data();

-- Clean up expired sessions specifically
SELECT cleanup_expired_user_sessions();
```

## Troubleshooting

If migrations fail:

1. **Syntax Errors**: All functions now use proper `$$` dollar-quoted syntax
2. Check that prerequisite tables exist (`tenants`, `profiles`)
3. Ensure proper permissions for the database user
4. Run individual migrations to identify specific issues
5. Check the validation output for missing components
6. Test syntax with: `\i scripts/syntax-check.sql`

For support, check the validation results and error messages in the migration logs.

## Testing

After running migrations, you can test them with:

```sql
\i scripts/test-e2e-authentication-migrations.sql
```

This will verify that all components are working correctly.

## Rollback

If you need to rollback the migrations (WARNING: This will delete all authentication data):

```sql
\i scripts/rollback-e2e-authentication-migrations.sql
```

## Files Created

- `scripts/39-add-mfa-configuration.sql` - MFA configuration table
- `scripts/38-create-security-events-table.sql` - Security events logging
- `scripts/40-create-session-tracking.sql` - Session management
- `scripts/41-update-api-keys-permissions.sql` - API key permissions
- `scripts/42-add-tenant-isolation-constraints.sql` - Tenant isolation
- `scripts/43-e2e-authentication-complete-migration.sql` - Integration
- `scripts/44-e2e-authentication-final-validation.sql` - Validation
- `scripts/run-e2e-authentication-migrations.sql` - Migration runner
- `scripts/test-e2e-authentication-migrations.sql` - Migration tests
- `scripts/rollback-e2e-authentication-migrations.sql` - Rollback script
- `scripts/E2E_AUTHENTICATION_MIGRATIONS_README.md` - This documentation