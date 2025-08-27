#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  const filePath = path.join(__dirname, migrationFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    return false;
  }

  console.log(`\n🚀 Running migration: ${migrationFile}`);
  console.log('=' .repeat(60));

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements or comments
      if (!statement || statement.startsWith('--') || statement.match(/^\s*$/)) {
        continue;
      }

      try {
        console.log(`  📝 Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('_temp_migration_exec')
            .select('*')
            .limit(0);
          
          if (directError) {
            // Execute using raw SQL
            const { error: rawError } = await supabase.rpc('exec', {
              query: statement + ';'
            });
            
            if (rawError) {
              console.error(`  ❌ Error in statement ${i + 1}:`, rawError.message);
              errorCount++;
              
              // Continue with next statement for non-critical errors
              if (!rawError.message.includes('already exists') && 
                  !rawError.message.includes('does not exist')) {
                continue;
              }
            } else {
              successCount++;
            }
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
        
      } catch (err) {
        console.error(`  ❌ Error in statement ${i + 1}:`, err.message);
        errorCount++;
        
        // Continue with next statement for non-critical errors
        if (!err.message.includes('already exists') && 
            !err.message.includes('does not exist')) {
          continue;
        }
      }
    }

    console.log(`\n📊 Migration ${migrationFile} completed:`);
    console.log(`  ✅ Successful statements: ${successCount}`);
    console.log(`  ❌ Failed statements: ${errorCount}`);
    
    return errorCount === 0;

  } catch (error) {
    console.error(`❌ Failed to run migration ${migrationFile}:`, error.message);
    return false;
  }
}

async function runDirectSQL(migrationFile) {
  const filePath = path.join(__dirname, migrationFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    return false;
  }

  console.log(`\n🚀 Running migration: ${migrationFile}`);
  console.log('=' .repeat(60));

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the entire SQL file at once
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql_query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Migration ${migrationFile} completed successfully`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to run migration ${migrationFile}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Running Analytics & Reporting Migrations');
  console.log('=' .repeat(60));
  
  const migrations = [
    '47-analytics-dashboard-system.sql',
    '48-ml-predictive-analytics-system.sql', 
    '49-advanced-reporting-system.sql'
  ];

  let allSuccessful = true;

  for (const migration of migrations) {
    const success = await runDirectSQL(migration);
    if (!success) {
      allSuccessful = false;
      console.log(`⚠️  Migration ${migration} had issues, but continuing...`);
    }
    
    // Wait a bit between migrations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '=' .repeat(60));
  if (allSuccessful) {
    console.log('🎉 All migrations completed successfully!');
  } else {
    console.log('⚠️  Some migrations had issues. Check the logs above.');
    console.log('💡 You may need to run individual statements manually in Supabase SQL Editor.');
  }
  console.log('=' .repeat(60));
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigration, runDirectSQL };