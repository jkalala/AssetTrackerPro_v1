#!/usr/bin/env node

/**
 * Simple Migration Runner for Supabase
 * Runs SQL files directly against the database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeSQLFile(filename) {
  console.log(`🔄 Executing: ${filename}`);
  
  const filePath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Use the SQL editor functionality or direct query
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ SQL Error in ${filename}:`, error.message);
      return false;
    }
    
    console.log(`✅ Successfully executed: ${filename}`);
    if (data) {
      console.log('   Result:', data);
    }
    return true;
    
  } catch (error) {
    console.error(`❌ Execution failed for ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node migrate.js <sql-file>');
    console.log('Example: node migrate.js 43-e2e-authentication-complete-migration.sql');
    process.exit(1);
  }
  
  const filename = args[0];
  console.log('🚀 Starting migration...');
  
  const success = await executeSQLFile(filename);
  
  if (success) {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('💥 Migration failed!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});