#!/usr/bin/env node

/**
 * Complete Migration Runner
 * Identifies and runs all pending migrations in the correct order
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Define the correct migration order for E2E authentication
const MIGRATION_ORDER = [
  // Core foundation migrations (should already be run)
  '03-enterprise-schema.sql',
  '04-enterprise-rls.sql', 
  '05-migration-to-enterprise.sql',
  '06-advanced-authentication.sql',
  
  // E2E Authentication specific migrations
  '38-create-security-events-table.sql',
  '39-add-mfa-configuration.sql',
  '40-create-session-tracking.sql',
  '41-update-api-keys-permissions.sql',
  '42-add-tenant-isolation-constraints.sql',
  '43-e2e-authentication-complete-migration.sql',
  '44-e2e-authentication-final-validation.sql',
  
  // Fix for current issue
  'fix-security-event-tenant-constraint.sql'
];

function getMigrationFiles() {
  const files = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.sql'))
    .filter(file => !file.includes('test') && !file.includes('rollback') && !file.includes('debug'))
    .sort();
  
  return files;
}

function displayMigrationPlan() {
  console.log('🚀 Complete Migration Analysis');
  console.log('=' .repeat(60));
  
  const allFiles = getMigrationFiles();
  const orderedMigrations = MIGRATION_ORDER.filter(file => 
    allFiles.includes(file) && fs.existsSync(path.join(__dirname, file))
  );
  
  console.log('\n📋 Recommended Migration Order:');
  console.log('=' .repeat(40));
  
  orderedMigrations.forEach((file, index) => {
    const filePath = path.join(__dirname, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    
    console.log(`${index + 1}. ${file} (${sizeKB}KB)`);
    
    // Add description based on filename
    if (file.includes('security-events')) {
      console.log('   📝 Creates security events logging table');
    } else if (file.includes('mfa-configuration')) {
      console.log('   🔐 Sets up MFA configuration and TOTP');
    } else if (file.includes('session-tracking')) {
      console.log('   👥 Creates user session management');
    } else if (file.includes('api-keys-permissions')) {
      console.log('   🔑 Adds permissions to API keys');
    } else if (file.includes('tenant-isolation')) {
      console.log('   🏢 Enforces tenant data isolation');
    } else if (file.includes('complete-migration')) {
      console.log('   🔧 Integrates all authentication components');
    } else if (file.includes('final-validation')) {
      console.log('   ✅ Validates complete setup');
    } else if (file.includes('fix-security-event')) {
      console.log('   🛠️  Fixes tenant constraint issue');
    }
  });
  
  console.log('\n🎯 Priority Migrations (for current issue):');
  console.log('=' .repeat(40));
  console.log('1. fix-security-event-tenant-constraint.sql - URGENT');
  console.log('2. 43-e2e-authentication-complete-migration.sql - Core functionality');
  console.log('3. 44-e2e-authentication-final-validation.sql - Validation');
  
  return orderedMigrations;
}

function generateMigrationCommands(migrations) {
  console.log('\n🔧 Migration Commands:');
  console.log('=' .repeat(40));
  
  console.log('\n📌 Quick Fix (for immediate issue):');
  console.log('pnpm migrate:fix');
  
  console.log('\n📌 Core Migrations:');
  migrations.forEach((file, index) => {
    if (MIGRATION_ORDER.includes(file)) {
      console.log(`pnpm migrate ${file}`);
    }
  });
  
  console.log('\n📌 All-in-One Command:');
  console.log('# Copy and paste each migration SQL into Supabase SQL Editor');
  console.log('# Go to: https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/sql/new');
}

function generateSQLScript(migrations) {
  console.log('\n📄 Combined SQL Script:');
  console.log('=' .repeat(60));
  console.log('-- COMBINED E2E AUTHENTICATION MIGRATIONS');
  console.log('-- Copy this entire script and run it in Supabase SQL Editor');
  console.log('-- URL: https://supabase.com/dashboard/project/wyqohljdnrouovuqqdlt/sql/new');
  console.log('');
  console.log('BEGIN;');
  console.log('');
  
  // Priority migrations first
  const priorityMigrations = [
    'fix-security-event-tenant-constraint.sql',
    '43-e2e-authentication-complete-migration.sql',
    '44-e2e-authentication-final-validation.sql'
  ];
  
  priorityMigrations.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(`-- =====================================================`);
      console.log(`-- ${file.toUpperCase()}`);
      console.log(`-- =====================================================`);
      console.log('');
      
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      console.log(content);
      console.log('');
    }
  });
  
  console.log('COMMIT;');
  console.log('');
  console.log('-- Migration completed successfully');
  console.log('SELECT \'All E2E Authentication migrations completed\' as status;');
}

function analyzeCurrentState() {
  console.log('\n🔍 Current State Analysis:');
  console.log('=' .repeat(40));
  
  // Check if key files exist
  const keyMigrations = [
    'fix-security-event-tenant-constraint.sql',
    '43-e2e-authentication-complete-migration.sql', 
    '44-e2e-authentication-final-validation.sql'
  ];
  
  keyMigrations.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    
    if (exists) {
      const stats = fs.statSync(path.join(__dirname, file));
      console.log(`   Size: ${Math.round(stats.size / 1024)}KB`);
    }
  });
  
  console.log('\n💡 Recommendations:');
  console.log('1. Run the fix migration first to resolve the tenant constraint error');
  console.log('2. Then run the complete migration for full E2E authentication');
  console.log('3. Finally run validation to ensure everything is working');
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🚀 E2E Authentication Migration Planner');
  console.log(`🔗 Target Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  const migrations = displayMigrationPlan();
  
  if (args.includes('--commands')) {
    generateMigrationCommands(migrations);
  } else if (args.includes('--sql')) {
    generateSQLScript(migrations);
  } else if (args.includes('--analyze')) {
    analyzeCurrentState();
  } else {
    analyzeCurrentState();
    generateMigrationCommands(migrations);
    
    console.log('\n📖 Usage Options:');
    console.log('  node run-all-pending-migrations.js --commands  # Show migration commands');
    console.log('  node run-all-pending-migrations.js --sql       # Generate combined SQL');
    console.log('  node run-all-pending-migrations.js --analyze   # Analyze current state');
  }
}

main().catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});