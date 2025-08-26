# Supabase Migration System

This directory contains SQL migration files and tools to manage database schema changes for the AssetTracker Pro application.

## Quick Start

### 1. Fix the Current Issue

To fix the tenant constraint error you're experiencing:

```bash
pnpm migrate:fix
```

This will display the SQL to fix the `log_security_event` function. Copy and paste it into your Supabase SQL Editor.

### 2. Run the Main Migration

To run the complete E2E authentication migration:

```bash
pnpm migrate:43
```

Copy and paste the displayed SQL into your Supabase SQL Editor.

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm migrate:list` | List all available migration files |
| `pnpm migrate:fix` | Show the tenant constraint fix SQL |
| `pnpm migrate:43` | Show the complete E2E authentication migration |
| `pnpm migrate <filename>` | Show any specific migration file |

## Migration Files

### Current Migrations

1. **fix-security-event-tenant-constraint.sql** - Fixes the tenant_id constraint issue
2. **43-e2e-authentication-complete-migration.sql** - Complete E2E authentication setup

### How to Use

1. Run the command to display the migration SQL
2. Go to your Supabase dashboard: https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/sql/new
3. Copy and paste the displayed SQL
4. Click "Run" in the SQL Editor

## Migration Order

For the E2E authentication fixes, run migrations in this order:

1. First run the fix: `pnpm migrate:fix`
2. Then run the main migration: `pnpm migrate:43`

## Troubleshooting

### Common Issues

**Error: "null value in column tenant_id violates not-null constraint"**
- Solution: Run `pnpm migrate:fix` first

**Error: "function does not exist"**
- Solution: Make sure you've run all previous migrations in order

**Error: "table does not exist"**
- Solution: Check that your database schema is properly set up

### Getting Help

If you encounter issues:

1. Check the migration order above
2. Verify your Supabase connection in `.env`
3. Make sure you have the necessary permissions in Supabase
4. Check the Supabase logs for detailed error messages

## Development

### Adding New Migrations

1. Create a new `.sql` file in the `scripts/` directory
2. Use a descriptive filename with a number prefix (e.g., `44-new-feature.sql`)
3. Test the migration on a development database first
4. Add any necessary rollback scripts

### Migration Best Practices

- Always backup your database before running migrations
- Test migrations on a development environment first
- Use transactions where possible
- Include proper error handling
- Document any breaking changes
- Use descriptive comments in your SQL

## Files in this Directory

- `supabase-migrate.js` - Advanced migration runner (requires CLI)
- `show-migration.js` - Simple migration display tool (current default)
- `direct-migrate.js` - Direct API migration runner (experimental)
- `run-migrations.js` - Full migration management system
- `*.sql` - Migration files
- `MIGRATION_README.md` - This file

## Environment Variables

Make sure these are set in your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Notes

- Never commit sensitive keys to version control
- Use environment variables for all credentials
- Test migrations on non-production data first
- Always have a rollback plan