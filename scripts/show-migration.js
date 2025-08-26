#!/usr/bin/env node

/**
 * Migration Display Tool
 * Shows migration SQL for manual execution in Supabase dashboard
 */

const fs = require('fs');
const path = require('path');

function displayMigration(filename) {
  const filePath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log('🚀 Supabase Migration Display');
  console.log('=' .repeat(60));
  console.log(`📄 File: ${filename}`);
  console.log(`📏 Size: ${sql.length} characters`);
  console.log('=' .repeat(60));
  console.log();
  console.log('📋 Copy the SQL below and paste it into your Supabase SQL Editor:');
  console.log();
  console.log('🔗 Go to: https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/sql/new');
  console.log();
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log();
  console.log('✅ After pasting, click "Run" in the Supabase SQL Editor');
  
  return true;
}

function listMigrations() {
  const files = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log('📁 Available migration files:');
  files.forEach((file, index) => {
    const stats = fs.statSync(path.join(__dirname, file));
    console.log(`   ${index + 1}. ${file} (${stats.size} bytes)`);
  });
  
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🚀 Supabase Migration Display Tool');
    console.log();
    console.log('Usage:');
    console.log('  node show-migration.js <sql-file>     # Display migration SQL');
    console.log('  node show-migration.js --list         # List available migrations');
    console.log();
    console.log('Examples:');
    console.log('  node show-migration.js fix-security-event-tenant-constraint.sql');
    console.log('  node show-migration.js 43-e2e-authentication-complete-migration.sql');
    console.log();
    
    listMigrations();
    process.exit(1);
  }
  
  if (args[0] === '--list') {
    listMigrations();
    process.exit(0);
  }
  
  const filename = args[0];
  const success = displayMigration(filename);
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});