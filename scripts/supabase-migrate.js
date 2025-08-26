#!/usr/bin/env node

/**
 * Supabase Migration Runner
 * Handles complex SQL migrations with proper error handling
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
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseSQLStatements(sql) {
  // Remove comments and split by semicolons, but be careful with function definitions
  const lines = sql.split('\n');
  let cleanedSQL = '';
  let inFunction = false;
  let functionDepth = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comment lines
    if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
      continue;
    }
    
    // Track function definitions
    if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || 
        trimmedLine.includes('CREATE FUNCTION')) {
      inFunction = true;
      functionDepth = 0;
    }
    
    if (inFunction) {
      if (trimmedLine.includes('BEGIN')) {
        functionDepth++;
      }
      if (trimmedLine.includes('END;') || trimmedLine.includes('END $')) {
        functionDepth--;
        if (functionDepth <= 0) {
          inFunction = false;
        }
      }
    }
    
    cleanedSQL += line + '\n';
  }
  
  // Split into statements, but be careful with function definitions
  const statements = [];
  let currentStatement = '';
  let inFunctionDef = false;
  let dollarQuoteDepth = 0;
  
  const lines2 = cleanedSQL.split('\n');
  
  for (const line of lines2) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
      continue;
    }
    
    // Track dollar quoting for functions
    const dollarMatches = line.match(/\$/g);
    if (dollarMatches) {
      dollarQuoteDepth += dollarMatches.length;
    }
    
    currentStatement += line + '\n';
    
    // Check if this line ends a statement
    if (trimmedLine.endsWith(';') && dollarQuoteDepth % 2 === 0) {
      const statement = currentStatement.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(stmt => stmt.length > 0);
}

async function executeStatement(statement, index) {
  try {
    console.log(`   📝 Executing statement ${index + 1}...`);
    
    // For very long statements, show just the beginning
    const preview = statement.length > 100 
      ? statement.substring(0, 100) + '...' 
      : statement;
    console.log(`      ${preview.replace(/\n/g, ' ')}`);
    
    // Try different approaches to execute SQL
    let data, error;
    
    // First try: direct query for simple statements
    if (statement.trim().toUpperCase().startsWith('SELECT') || 
        statement.trim().toUpperCase().startsWith('INSERT') ||
        statement.trim().toUpperCase().startsWith('UPDATE') ||
        statement.trim().toUpperCase().startsWith('DELETE')) {
      const result = await supabase.from('').select().limit(0); // This won't work for DDL
      error = new Error('DDL statements not supported via client');
    } else {
      // For DDL statements, we need a different approach
      error = new Error('DDL statements require direct database access or Supabase CLI');
    }
    
    if (error) {
      throw new Error(`SQL Error: ${error.message}`);
    }
    
    console.log(`   ✅ Statement ${index + 1} completed`);
    return { success: true, data };
    
  } catch (error) {
    console.error(`   ❌ Statement ${index + 1} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function executeSQLFile(filename) {
  console.log(`\n🔄 Processing: ${filename}`);
  console.log('=' .repeat(50));
  
  const filePath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`📄 File size: ${sql.length} characters`);
  
  // Parse SQL into individual statements
  const statements = parseSQLStatements(sql);
  console.log(`📋 Found ${statements.length} SQL statements`);
  
  if (statements.length === 0) {
    console.log('⚠️  No executable statements found');
    return true;
  }
  
  let successCount = 0;
  let failureCount = 0;
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const result = await executeStatement(statements[i], i);
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
      
      // Stop on first failure unless --continue flag is provided
      if (!process.argv.includes('--continue')) {
        console.log('\n🛑 Stopping due to error. Use --continue to ignore failures.');
        break;
      }
    }
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Execution Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   📝 Total: ${statements.length}`);
  
  return failureCount === 0;
}

async function listMigrationFiles() {
  const files = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log('\n📁 Available migration files:');
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🚀 Supabase Migration Runner');
  console.log(`🔗 Connected to: ${SUPABASE_URL}`);
  
  if (args.length === 0) {
    console.log('\nUsage:');
    console.log('  node supabase-migrate.js <sql-file>     # Run specific migration');
    console.log('  node supabase-migrate.js --list         # List available migrations');
    console.log('  node supabase-migrate.js --continue     # Continue on errors');
    console.log('\nExamples:');
    console.log('  node supabase-migrate.js 43-e2e-authentication-complete-migration.sql');
    console.log('  node supabase-migrate.js fix-security-event-tenant-constraint.sql');
    
    await listMigrationFiles();
    process.exit(1);
  }
  
  if (args[0] === '--list') {
    await listMigrationFiles();
    process.exit(0);
  }
  
  const filename = args[0];
  console.log(`\n🎯 Target migration: ${filename}`);
  
  const success = await executeSQLFile(filename);
  
  if (success) {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Migration failed!');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});