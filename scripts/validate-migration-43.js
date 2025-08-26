#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Migration 43 Validation ===');

// Read the migration file
const migrationPath = path.join(__dirname, '43-e2e-authentication-complete-migration.sql');
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

// Check for ambiguous column references
const ambiguousPatterns = [
    /information_schema\.(tables|columns).*WHERE.*table_name\s*=\s*table_name(?!\s*\))/g,
    /information_schema\.(tables|columns).*WHERE.*column_name\s*=\s*column_name(?!\s*\))/g
];

ambiguousPatterns.forEach((pattern, index) => {
    const matches = migrationContent.match(pattern);
    if (matches) {
        issues.push(`Potential ambiguous column reference detected (pattern ${index + 1}): ${matches[0]}`);
    }
});

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

// Check for view creation
const viewCount = (migrationContent.match(/CREATE OR REPLACE VIEW/g) || []).length;
console.log(`✓ Found ${viewCount} view definitions`);

if (issues.length > 0) {
    console.log('\n❌ Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
} else {
    console.log('\n✅ No obvious syntax issues detected');
}

console.log('\n=== Migration Structure Analysis ===');

// Extract function names
const functionMatches = migrationContent.match(/CREATE OR REPLACE FUNCTION\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
if (functionMatches) {
    const functions = functionMatches.map(match => match.replace('CREATE OR REPLACE FUNCTION ', ''));
    console.log('Functions that will be created:');
    functions.forEach(func => console.log(`  - ${func}`));
}

console.log('\n=== Recommendations ===');
console.log('1. Run this migration after script 42 completes successfully');
console.log('2. Ensure all required tables exist before running');
console.log('3. Test on a development environment first');
console.log('4. Monitor for any function creation errors');

console.log('\n=== Next Steps ===');
console.log('If script 42 completed successfully:');
console.log('1. Copy the contents of scripts/43-e2e-authentication-complete-migration.sql');
console.log('2. Run it in your database environment');
console.log('3. Check for any error messages');
console.log('4. Verify that all functions and views were created successfully');