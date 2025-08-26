#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Migration 42 Validation ===');

// Read the migration file
const migrationPath = path.join(__dirname, '42-add-tenant-isolation-constraints.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('✓ Migration file exists and is readable');
console.log(`✓ Migration file size: ${migrationContent.length} characters`);

// Check for common issues
const issues = [];

// Check for proper dollar quoting
const dollarQuoteMatches = migrationContent.match(/\$\$/g);
if (dollarQuoteMatches && dollarQuoteMatches.length % 2 !== 0) {
    issues.push('Unmatched dollar quotes ($$) detected');
}

// Check for function definitions
const functionCount = (migrationContent.match(/CREATE OR REPLACE FUNCTION/g) || []).length;
console.log(`✓ Found ${functionCount} function definitions`);

// Check for table existence checks
const tableChecks = (migrationContent.match(/information_schema\.tables/g) || []).length;
console.log(`✓ Found ${tableChecks} table existence checks`);

// Check for column existence checks
const columnChecks = (migrationContent.match(/information_schema\.columns/g) || []).length;
console.log(`✓ Found ${columnChecks} column existence checks`);

// Check for tenant_id references
const tenantIdRefs = (migrationContent.match(/tenant_id/g) || []).length;
console.log(`✓ Found ${tenantIdRefs} tenant_id references`);

// Check for foreign key constraints
const fkConstraints = (migrationContent.match(/FOREIGN KEY.*REFERENCES/g) || []).length;
console.log(`✓ Found ${fkConstraints} foreign key constraint definitions`);

if (issues.length > 0) {
    console.log('\n❌ Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
} else {
    console.log('\n✅ No obvious syntax issues detected');
}

console.log('\n=== Migration Structure Analysis ===');

// Extract table names that will get tenant_id columns
const tableMatches = migrationContent.match(/table_name = '([^']+)'/g);
if (tableMatches) {
    const tables = [...new Set(tableMatches.map(match => match.match(/'([^']+)'/)[1]))];
    console.log('Tables that will be modified:');
    tables.forEach(table => console.log(`  - ${table}`));
}

console.log('\n=== Recommendations ===');
console.log('1. Run this migration in a transaction to allow rollback if needed');
console.log('2. Backup your database before running this migration');
console.log('3. Test on a development environment first');
console.log('4. Monitor for any foreign key constraint violations');

console.log('\n=== Next Steps ===');
console.log('If you have access to psql or Supabase SQL editor:');
console.log('1. Copy the contents of scripts/42-add-tenant-isolation-constraints.sql');
console.log('2. Run it in your database environment');
console.log('3. Check for any error messages');
console.log('4. Verify that tenant_id columns were added to the expected tables');