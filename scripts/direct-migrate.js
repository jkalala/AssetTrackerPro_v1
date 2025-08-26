#!/usr/bin/env node

/**
 * Direct Supabase Migration Runner
 * Uses Supabase REST API to execute SQL directly
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

function makeRequest(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    
    const postData = JSON.stringify({ sql });
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: data ? JSON.parse(data) : null });
        } else {
          resolve({ success: false, error: data || `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function executeSQLDirect(sql) {
  console.log('🔄 Executing SQL directly...');
  
  try {
    const result = await makeRequest(sql);
    
    if (result.success) {
      console.log('✅ SQL executed successfully');
      return true;
    } else {
      console.error('❌ SQL execution failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node direct-migrate.js <sql-file>');
    process.exit(1);
  }
  
  const filename = args[0];
  const filePath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filename}`);
    process.exit(1);
  }

  console.log('🚀 Direct Supabase Migration Runner');
  console.log(`🔗 Connected to: ${SUPABASE_URL}`);
  console.log(`📄 Processing: ${filename}`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  const success = await executeSQLDirect(sql);
  
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