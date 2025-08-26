# 🚀 Execute E2E Authentication Migrations

## Quick Start (Recommended)

### Step 1: Copy the Combined SQL
Run this command to get the complete migration SQL:
```bash
pnpm migrate:sql
```

### Step 2: Execute in Supabase
1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/sql/new
2. Copy the entire SQL output from Step 1
3. Paste it into the SQL Editor
4. Click "Run"

## Alternative: Individual Migrations

If you prefer to run migrations one by one:

### 1. Fix the Current Issue (URGENT)
```bash
pnpm migrate:fix
```
Copy and paste the SQL into Supabase SQL Editor.

### 2. Run Core Migration
```bash
pnpm migrate:43
```
Copy and paste the SQL into Supabase SQL Editor.

### 3. Run Validation
```bash
pnpm migrate:44
```
Copy and paste the SQL into Supabase SQL Editor.

## What These Migrations Do

### 🛠️ Fix Migration (`fix-security-event-tenant-constraint.sql`)
- **Purpose**: Fixes the tenant_id constraint error you're experiencing
- **What it does**: Updates the `log_security_event` function to handle NULL tenant_id gracefully
- **Priority**: URGENT - Run this first

### 🔧 Complete Migration (`43-e2e-authentication-complete-migration.sql`)
- **Purpose**: Sets up all E2E authentication components
- **What it does**:
  - Creates helper functions for tenant context
  - Sets up MFA backup code generation
  - Creates session management functions
  - Adds security event logging
  - Creates authentication status views
  - Adds proper indexes and constraints

### ✅ Validation Migration (`44-e2e-authentication-final-validation.sql`)
- **Purpose**: Validates that everything is working correctly
- **What it does**:
  - Checks all required tables exist
  - Validates functions are created
  - Verifies RLS policies are in place
  - Provides authentication statistics
  - Creates monitoring views

## Expected Results

After running all migrations, you should see:

1. **No more tenant constraint errors**
2. **All E2E tests should pass**
3. **Authentication features working properly**:
   - API key management with permissions
   - MFA setup and verification
   - Session tracking
   - Security event logging
   - Tenant isolation

## Verification

After running migrations, you can verify success by running these queries in Supabase:

```sql
-- Check validation results
SELECT * FROM validate_e2e_authentication_setup();

-- Get authentication statistics
SELECT * FROM get_authentication_stats();

-- View table summary
SELECT * FROM authentication_tables_summary;
```

## Troubleshooting

### If migrations fail:
1. Check that you have the necessary permissions in Supabase
2. Ensure your database has the required base tables (`tenants`, `profiles`)
3. Run migrations one by one to identify specific issues
4. Check the Supabase logs for detailed error messages

### Common Issues:
- **"table does not exist"**: Make sure base schema migrations have been run
- **"permission denied"**: Check your Supabase user permissions
- **"function already exists"**: This is normal, functions will be updated

## Support

If you encounter issues:
1. Check the validation output for missing components
2. Review error messages in Supabase logs
3. Run individual migrations to isolate problems
4. Use the migration planner: `pnpm migrate:plan`

## Files Created/Updated

These migrations will create or update:
- Functions: `log_security_event`, `get_current_tenant_id`, `generate_mfa_backup_codes`, etc.
- Views: `user_auth_status`, `authentication_tables_summary`
- Indexes: Performance indexes for authentication tables
- Constraints: Tenant isolation constraints

## Next Steps

After successful migration:
1. Run your E2E tests to verify functionality
2. Test authentication features in your application
3. Monitor the `security_events` table for proper logging
4. Use the validation functions for ongoing health checks