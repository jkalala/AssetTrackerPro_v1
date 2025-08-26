#!/usr/bin/env node

/**
 * Migration Runner Script
 * Automatically runs SQL migrations against Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Migration tracking table
const MIGRATIONS_TABLE = 'schema_migrations';

async function ensureMigrationsTable() {
  console.log('📋 Ensuring migrations table exists...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64),
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON ${MIGRATIONS_TABLE}(filename);
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON ${MIGRATIONS_TABLE}(executed_at);
    `
  });

  if (error) {
    console.error('❌ Failed to create migrations table:', error.message);
    return false;
  }
  
  console.log('✅ Migrations table ready');
  return true;
}

async function getExecutedMigrations() {
  const { data, error } = await supabase
    .from(MIGRATIONS_TABLE)
    .select('filename, executed_at, success')
    .eq('success', true)
    .order('executed_at', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch executed migrations:', error.message);
    return [];
  }

  return data || [];
}

async function recordMigration(filename, success, errorMessage = null) {
  const checksum = require('crypto')
    .createHash('md5')
    .update(fs.readFileSync(path.join(__dirname, filename), 'utf8'))
    .digest('hex');

  const { error } = await supabase
    .from(MIGRATIONS_TABLE)
    .insert({
      filename,
      success,
      error_message: errorMessage,
      checksum
    });

  if (error) {
    console.error('❌ Failed to record migration:', error.message);
  }
}

async function executeMigration(filename) {
  console.log(`🔄 Executing migration: ${filename}`);
  
  const migrationPath = path.join(__dirname, filename);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    // For complex migrations, we might need to split by statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          throw new Error(`SQL Error: ${error.message}`);
        }
      }
    }

    await recordMigration(filename, true);
    console.log(`✅ Migration completed: ${filename}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Migration failed: ${filename}`);
    console.error(`   Error: ${error.message}`);
    await recordMigration(filename, false, error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting migration runner...');
  
  // Ensure migrations table exists
  const tableReady = await ensureMigrationsTable();
  if (!tableReady) {
    process.exit(1);
  }

  // Get list of migration files
  const migrationFiles = fs.readdirSync(__dirname)
    .filter(file => file.match(/^\d+.*\.sql$/))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('📝 No migration files found');
    return;
  }

  // Get already executed migrations
  const executedMigrations = await getExecutedMigrations();
  const executedFilenames = new Set(executedMigrations.map(m => m.filename));

  // Find pending migrations
  const pendingMigrations = migrationFiles.filter(file => !executedFilenames.has(file));

  if (pendingMigrations.length === 0) {
    console.log('✅ All migrations are up to date');
    return;
  }

  console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
  pendingMigrations.forEach(file => console.log(`   - ${file}`));

  // Execute pending migrations
  let successCount = 0;
  let failureCount = 0;

  for (const migration of pendingMigrations) {
    const success = await executeMigration(migration);
    if (success) {
      successCount++;
    } else {
      failureCount++;
      
      // Stop on first failure unless --continue flag is provided
      if (!process.argv.includes('--continue')) {
        console.log('🛑 Stopping due to migration failure. Use --continue to ignore failures.');
        break;
      }
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  
  if (failureCount > 0) {
    process.exit(1);
  }
}

// Handle specific migration file
async function runSpecificMigration(filename) {
  console.log(`🎯 Running specific migration: ${filename}`);
  
  const tableReady = await ensureMigrationsTable();
  if (!tableReady) {
    process.exit(1);
  }

  const success = await executeMigration(filename);
  process.exit(success ? 0 : 1);
}

// CLI handling
const args = process.argv.slice(2);

if (args.length > 0 && !args[0].startsWith('--')) {
  // Run specific migration
  runSpecificMigration(args[0]);
} else {
  // Run all pending migrations
  runMigrations();
}