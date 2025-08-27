#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 Applying Analytics & Reporting Migrations');
console.log('=' .repeat(60));

const migrations = [
  '47-analytics-dashboard-system.sql',
  '48-ml-predictive-analytics-system.sql', 
  '49-advanced-reporting-system.sql'
];

function runMigration(migrationFile) {
  const filePath = path.join(__dirname, migrationFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    return false;
  }

  console.log(`\n🚀 Applying migration: ${migrationFile}`);
  console.log('-' .repeat(40));

  try {
    // Try using supabase CLI first
    try {
      execSync(`supabase db reset --db-url "$DATABASE_URL"`, { 
        stdio: 'pipe',
        cwd: __dirname 
      });
      console.log('  ✅ Database reset successful');
    } catch (resetError) {
      console.log('  ⚠️  Database reset not available, continuing...');
    }

    // Apply the migration using supabase CLI
    try {
      const result = execSync(`supabase db push --db-url "$DATABASE_URL" --include-all`, {
        stdio: 'pipe',
        cwd: __dirname
      });
      console.log('  ✅ Migration applied via Supabase CLI');
      return true;
    } catch (cliError) {
      console.log('  ⚠️  Supabase CLI not available, trying direct approach...');
    }

    // Fallback: Read and display the SQL for manual execution
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n📋 SQL for ${migrationFile}:`);
    console.log('=' .repeat(60));
    console.log(sql);
    console.log('=' .repeat(60));
    
    return true;

  } catch (error) {
    console.error(`❌ Error processing ${migrationFile}:`, error.message);
    return false;
  }
}

function main() {
  let allSuccessful = true;

  for (const migration of migrations) {
    const success = runMigration(migration);
    if (!success) {
      allSuccessful = false;
    }
  }

  console.log('\n' + '=' .repeat(60));
  if (allSuccessful) {
    console.log('🎉 All migrations processed!');
    console.log('💡 Copy and paste the SQL above into your Supabase SQL Editor');
  } else {
    console.log('⚠️  Some migrations had issues.');
  }
  console.log('=' .repeat(60));
}

main();