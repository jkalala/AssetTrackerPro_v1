# Migration 42 Fixes - Tenant Isolation Constraints

## Problems Fixed

### 1. Column Reference Error
```
ERROR: 42703: column "tenant_id" referenced in foreign key constraint does not exist
```

### 2. Syntax Error  
```
ERROR: 42601: syntax error at or near "NOT" LINE 171: ADD CONSTRAINT IF NOT EXISTS
```

### 3. Function Dependency Error
```
ERROR: 42703: column "tenant_id" does not exist
```

## Root Causes
1. The script was trying to add foreign key constraints to tables that didn't have the `tenant_id` column yet
2. PostgreSQL doesn't support `ADD CONSTRAINT IF NOT EXISTS` syntax
3. The `get_current_tenant_id()` function was referencing `profiles.tenant_id` before that column was created

## Solution Applied

### 1. Added Conditional Column Creation
- Wrapped all `ALTER TABLE ADD COLUMN` statements in `DO $$ ... END $$` blocks
- Added checks for table existence using `information_schema.tables`
- Added checks for column existence using `information_schema.columns`
- Only add `tenant_id` columns if they don't already exist

### 2. Fixed Table Names
- Corrected `asset_custom_fields` to `asset_custom_field_values` (the actual table name)
- Added support for `asset_field_definitions` table

### 3. Fixed PostgreSQL Syntax Issues
- Replaced `ADD CONSTRAINT IF NOT EXISTS` with proper constraint existence checks
- Used `information_schema.table_constraints` to check if constraints already exist
- Added proper conditional logic for constraint creation

### 4. Fixed Function Dependencies
- Made `get_current_tenant_id()` function check for column existence before referencing it
- Added conditional logic to handle cases where `tenant_id` column doesn't exist yet
- Updated function definition after columns are added for better performance

### 5. Improved Error Handling
- Added conditional foreign key constraint creation
- Only create constraints if the target table and column exist
- Added proper transaction handling with DO blocks

### 4. Enhanced Trigger Creation
- Made trigger creation conditional based on table existence
- Added DROP TRIGGER IF EXISTS before creating new triggers
- Extended triggers to cover all tables with tenant_id columns

## Tables Modified
The following tables will get `tenant_id` columns added (if they don't already have them):

1. `profiles` - User profiles
2. `asset_location_history` - Asset location tracking
3. `geofence_zones` - Geofence definitions
4. `asset_attachments` - File attachments for assets
5. `custom_reports` - User-defined reports
6. `asset_maintenance_schedules` - Maintenance scheduling
7. `asset_lifecycle_rules` - Asset lifecycle management
8. `asset_categories` - Asset categorization
9. `asset_custom_field_values` - Custom field values

## Functions Created
1. `get_current_tenant_id()` - Gets current tenant context
2. `has_any_role()` - Role-based access control
3. `enforce_tenant_isolation()` - Trigger function for automatic tenant_id assignment
4. `validate_tenant_access()` - Cross-tenant access validation
5. `log_tenant_violation()` - Security violation logging

## How to Run

### Option 1: Supabase SQL Editor
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy the contents of `scripts/42-add-tenant-isolation-constraints.sql`
4. Paste and execute

### Option 2: psql (if available)
```bash
psql "your-database-url" -f scripts/42-add-tenant-isolation-constraints.sql
```

### Option 3: Through Application
If you have database migration functionality in your app, use that to execute the SQL.

## Verification
After running the migration, verify:

1. **Check columns were added:**
```sql
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
ORDER BY table_name;
```

2. **Check functions exist:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_current_tenant_id', 'has_any_role', 'enforce_tenant_isolation');
```

3. **Check triggers exist:**
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%tenant_isolation%';
```

## Rollback
If you need to rollback, use the existing rollback script:
```bash
# Run the rollback script
scripts/rollback-e2e-authentication-migrations.sql
```

## Next Steps
After this migration succeeds, you can continue with:
- Script 43: Complete migration integration
- Script 44: Final validation
- Run the test suite to verify everything works

## Notes
- This migration is idempotent - it can be run multiple times safely
- All changes are wrapped in conditional blocks to prevent errors
- Existing data will be assigned to the first available tenant
- New records will automatically get the correct tenant_id via triggers
## ✅ 
Testing Scripts Available:

1. **`scripts/42-minimal-test.sql`** - Minimal test to check basic functionality
2. **`scripts/42-step-by-step.sql`** - Step-by-step migration to identify issues  
3. **`scripts/debug-migration-42.sql`** - Debug script to check database state
4. **`scripts/validate-migration-42.js`** - Validates the migration script syntax

## ✅ Recommended Testing Approach:

1. **First**: Run `scripts/42-minimal-test.sql` to test basic functionality
2. **If that works**: Run `scripts/42-step-by-step.sql` to test step by step
3. **If that works**: Run the full `scripts/42-add-tenant-isolation-constraints.sql`
4. **If issues occur**: Run `scripts/debug-migration-42.sql` to diagnose

## ✅ Final Status:

The migration script has been completely rewritten to handle all edge cases:

- ✅ All `tenant_id` column references are now conditional
- ✅ All function definitions are safe and don't reference non-existent columns
- ✅ All RLS policies are created conditionally
- ✅ All indexes are created conditionally  
- ✅ All views are created conditionally
- ✅ The script is completely idempotent and safe to run multiple times

The migration should now run successfully without any "tenant_id does not exist" errors.