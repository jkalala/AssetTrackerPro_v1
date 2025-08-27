#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to process for TypeScript any type fixes
const filesToProcess = [
  // GraphQL files
  'lib/graphql/resolvers/scalar-resolvers.ts',
  'lib/graphql/server.ts',
  
  // Middleware files
  'lib/middleware/api-key-auth.ts',
  'lib/middleware/auth.ts',
  'lib/middleware/rate-limit.ts',
  'lib/middleware/role-validation.ts',
  'lib/middleware/tenant-context.ts',
  'lib/middleware/tenant-isolation.ts',
  
  // Service files
  'lib/services/analytics-service.ts',
  'lib/services/api-key-service.ts',
  'lib/services/asset-service.ts',
  'lib/services/department-service.ts',
  'lib/services/financial-analytics-service.ts',
  'lib/services/integration-service.ts',
  'lib/services/mfa-service.ts',
  'lib/services/ml-service.ts',
  'lib/services/permission-service.ts',
  'lib/services/reporting-service.ts',
  'lib/services/role-service.ts',
  'lib/services/search-service.ts',
  'lib/services/security-event-service.ts',
  'lib/services/session-service.ts',
  'lib/services/sso-service.ts',
  'lib/services/tenant-configuration.ts',
  'lib/services/tenant-provisioning.ts',
  'lib/services/tenant-service.ts',
  'lib/services/user-service.ts',
  'lib/services/webhook-service.ts',
  
  // Utility files
  'lib/realtime-client.ts',
  'lib/security/rls-utils.ts',
  'lib/supabase/client.ts',
  'lib/utils/data-permission-filters.ts',
  'lib/utils/enhance-api-with-rate-limit.ts',
  'lib/utils/permission-cache.ts',
  'lib/qr-actions.ts',
  
  // Type definition files
  'lib/types/database.ts',
  'lib/types/ml.ts',
  'lib/types/rbac.ts',
  'lib/types/reporting.ts',
  
  // Main middleware
  'middleware.ts'
];

function fixAnyTypes(filePath) {
  console.log(`Processing ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Common any type replacements with more specific types
  const typeReplacements = [
    // Database query results
    { from: /: any\[\]/g, to: ': Record<string, unknown>[]' },
    { from: /: any\s*=/g, to: ': Record<string, unknown> =' },
    
    // Function parameters
    { from: /\(([^:]+): any\)/g, to: '($1: Record<string, unknown>)' },
    { from: /\(([^:]+): any,/g, to: '($1: Record<string, unknown>,' },
    { from: /, ([^:]+): any\)/g, to: ', $1: Record<string, unknown>)' },
    { from: /, ([^:]+): any,/g, to: ', $1: Record<string, unknown>,' },
    
    // Return types for common patterns
    { from: /Promise<any>/g, to: 'Promise<Record<string, unknown>>' },
    { from: /Array<any>/g, to: 'Array<Record<string, unknown>>' },
    
    // Specific patterns for database operations
    { from: /data: any/g, to: 'data: Record<string, unknown>' },
    { from: /result: any/g, to: 'result: Record<string, unknown>' },
    { from: /response: any/g, to: 'response: Record<string, unknown>' },
    { from: /payload: any/g, to: 'payload: Record<string, unknown>' },
    { from: /body: any/g, to: 'body: Record<string, unknown>' },
    { from: /params: any/g, to: 'params: Record<string, unknown>' },
    { from: /query: any/g, to: 'query: Record<string, unknown>' },
    { from: /config: any/g, to: 'config: Record<string, unknown>' },
    { from: /options: any/g, to: 'options: Record<string, unknown>' },
    { from: /metadata: any/g, to: 'metadata: Record<string, unknown>' },
    { from: /context: any/g, to: 'context: Record<string, unknown>' },
    { from: /args: any/g, to: 'args: Record<string, unknown>' },
    
    // GraphQL specific types
    { from: /parent: any/g, to: 'parent: Record<string, unknown>' },
    { from: /root: any/g, to: 'root: Record<string, unknown>' },
    { from: /info: any/g, to: 'info: Record<string, unknown>' },
    
    // Error handling
    { from: /error: any/g, to: 'error: Error | Record<string, unknown>' },
    { from: /err: any/g, to: 'err: Error | Record<string, unknown>' },
    
    // API responses
    { from: /apiResponse: any/g, to: 'apiResponse: Record<string, unknown>' },
    { from: /json: any/g, to: 'json: Record<string, unknown>' },
    
    // Specific service patterns
    { from: /tenant: any/g, to: 'tenant: Record<string, unknown>' },
    { from: /user: any/g, to: 'user: Record<string, unknown>' },
    { from: /asset: any/g, to: 'asset: Record<string, unknown>' },
    { from: /role: any/g, to: 'role: Record<string, unknown>' },
    { from: /permission: any/g, to: 'permission: Record<string, unknown>' },
    
    // Database row types
    { from: /row: any/g, to: 'row: Record<string, unknown>' },
    { from: /rows: any/g, to: 'rows: Record<string, unknown>[]' },
    
    // Generic object types
    { from: /obj: any/g, to: 'obj: Record<string, unknown>' },
    { from: /item: any/g, to: 'item: Record<string, unknown>' },
    { from: /value: any/g, to: 'value: unknown' },
    { from: /val: any/g, to: 'val: unknown' },
  ];
  
  typeReplacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  // Fix specific patterns that need more context
  
  // Fix function return types
  content = content.replace(
    /async function[^(]*\([^)]*\): any/g,
    'async function$&: Promise<Record<string, unknown>>'
  );
  
  // Fix arrow function return types
  content = content.replace(
    /=>\s*any/g,
    '=> Record<string, unknown>'
  );
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed 'any' types in ${filePath}`);
  } else {
    console.log(`ℹ️  No 'any' types to fix in ${filePath}`);
  }
}

// Process all files
console.log('🚀 Starting TypeScript any type fixes...\n');

filesToProcess.forEach(filePath => {
  try {
    fixAnyTypes(filePath);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✅ TypeScript any type fixes completed!');
console.log('\n🔍 Running TypeScript check to verify improvements...');

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed!');
} catch (error) {
  console.log('ℹ️  TypeScript check completed with remaining issues to fix.');
}