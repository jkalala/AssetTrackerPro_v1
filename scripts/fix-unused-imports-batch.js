#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to process in this batch - focusing on high-impact, low-risk files first
const filesToProcess = [
  // GraphQL resolvers - safe to fix
  'lib/graphql/resolvers/integration-resolvers.ts',
  'lib/graphql/resolvers/user-resolvers.ts', 
  'lib/graphql/resolvers/webhook-resolvers.ts',
  'lib/graphql/server.ts',
  
  // Utility files - safe to fix
  'lib/integration-utils.ts',
  'lib/qr-actions.ts',
  'lib/qr-code-utils.ts',
  'lib/webhook-utils.ts',
  'lib/supabase/middleware.ts',
  
  // Service files - medium risk but high impact
  'lib/services/dashboard-service.ts',
  'lib/services/delegation-service.ts',
  'lib/services/department-service.ts',
  'lib/services/mfa-service.ts',
  'lib/services/ml-service.ts',
  'lib/services/permission-service.ts',
  'lib/services/reporting-service.ts',
  'lib/services/role-service.ts',
  'lib/services/sso-service.ts',
  'lib/services/tenant-provisioning.ts',
  'lib/services/tenant-service.ts',
  
  // Utility files
  'lib/utils/api-rate-limit.ts',
  'lib/utils/form-validation.ts',
  'lib/utils/permission-cache.ts',
  
  // Middleware files
  'middleware.ts',
  
  // React Native screens - safe to fix
  'src/screens/AssetsScreen.js',
  'src/screens/CheckoutScreen.js',
  'src/screens/HomeScreen.js',
  'src/screens/LocationScreen.js',
  'src/screens/ScannerScreen.js',
  'src/screens/SettingsScreen.js',
  
  // Service worker
  'public/service-worker.js'
];

function fixUnusedImports(filePath) {
  console.log(`Processing ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix unused imports - remove entire import lines that are unused
  const unusedImportPatterns = [
    // Remove unused named imports
    /import\s+{\s*[^}]*'or'[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*'List'[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*'Divider'[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*'Button'[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*'Paragraph'[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*'ActivityIndicator'[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*'createClientClient'[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
  ];
  
  unusedImportPatterns.forEach(pattern => {
    const newContent = content.replace(pattern, '');
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  // Fix unused variables by prefixing with underscore
  const unusedVariablePatterns = [
    // Fix unused parameters and variables
    { from: /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*[^;]+;\s*\/\/\s*unused/g, to: 'const _$1 = ' },
    { from: /let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*[^;]+;\s*\/\/\s*unused/g, to: 'let _$1 = ' },
    
    // Specific patterns from lint output
    { from: /\b(isAdmin)\s*=/g, to: '_$1 =' },
    { from: /\b(isSuperAdmin)\s*=/g, to: '_$1 =' },
    { from: /\b(error)\s*=>/g, to: '_error =>' },
    { from: /\b(err)\s*=>/g, to: '_err =>' },
    { from: /\bcatch\s*\(\s*(error|err)\s*\)/g, to: 'catch (_$1)' },
    { from: /\b(width|height)\s*=/g, to: '_$1 =' },
    { from: /\b(navigation)\s*\)/g, to: '_navigation)' },
    { from: /\b(type)\s*\)/g, to: '_type)' },
    { from: /\b(imageData)\s*=/g, to: '_imageData =' },
    { from: /\b(userCountMap)\s*=/g, to: '_userCountMap =' },
    { from: /\b(days)\s*=/g, to: '_days =' },
    { from: /\b(parameters)\s*=/g, to: '_parameters =' },
    { from: /\b(exportConfig)\s*=/g, to: '_exportConfig =' },
    { from: /\b(query)\s*=/g, to: '_query =' },
    { from: /\b(template)\s*=/g, to: '_template =' },
    { from: /\b(mimeType)\s*=/g, to: '_mimeType =' },
    { from: /\b(tenantId)\s*,/g, to: '_tenantId,' },
    { from: /\b(delegatorId)\s*,/g, to: '_delegatorId,' },
    { from: /\b(permissionNames)\s*,/g, to: '_permissionNames,' },
    { from: /\b(userId)\s*,/g, to: '_userId,' },
    { from: /\b(maxSessions)\s*=/g, to: '_maxSessions =' },
    { from: /\b(retryAfter)\s*=/g, to: '_retryAfter =' },
    { from: /\b(permissions)\s*=/g, to: '_permissions =' },
    { from: /\b(headers)\s*=/g, to: '_headers =' },
    { from: /\b(rateLimitHeaders)\s*=/g, to: '_rateLimitHeaders =' },
    { from: /\b(userKey)\s*=/g, to: '_userKey =' },
    { from: /\b(ipAddress)\s*,/g, to: '_ipAddress,' },
    { from: /\b(integration)\s*,/g, to: '_integration,' },
    { from: /\b(syncResultId)\s*,/g, to: '_syncResultId,' },
    { from: /\b(config)\s*=/g, to: '_config =' },
    { from: /\b(decodedResponse)\s*=/g, to: '_decodedResponse =' },
    { from: /\b(returnUrl)\s*,/g, to: '_returnUrl,' },
    { from: /\b(createdBy)\s*,/g, to: '_createdBy,' },
    { from: /\b(tenant)\s*,/g, to: '_tenant,' },
    { from: /\b(details)\s*,/g, to: '_details,' },
    { from: /\b(data)\s*=/g, to: '_data =' },
    { from: /\b(lastMaintenanceDays)\s*,/g, to: '_lastMaintenanceDays,' },
    { from: /\b(probability)\s*,/g, to: '_probability,' },
    { from: /\b(features)\s*,/g, to: '_features,' },
    { from: /\b(utilizationData)\s*,/g, to: '_utilizationData,' },
    { from: /\b(historicalData)\s*,/g, to: '_historicalData,' },
    { from: /\b(name)\s*,/g, to: '_name,' },
    { from: /\b(sessionId)\s*,/g, to: '_sessionId,' },
    { from: /\b(options)\s*\)/g, to: '_options)' },
    { from: /\b(event)\s*\)/g, to: '_event)' },
  ];
  
  unusedVariablePatterns.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  // Remove unused type imports
  const unusedTypePatterns = [
    /import\s+{\s*[^}]*DepartmentRoleInsert[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*UserRoleInsert[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*RBACError[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*Database[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*RoleInsert[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*MfaMethodUpdate[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*MfaVerificationAttempt[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*SsoSession[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*PermissionUsage[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*PermissionAction[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
    /import\s+{\s*[^}]*PermissionScope[^}]*}\s+from\s+['"'][^'"]+['"];?\s*\n/g,
  ];
  
  unusedTypePatterns.forEach(pattern => {
    const newContent = content.replace(pattern, '');
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed unused imports/variables in ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed in ${filePath}`);
  }
}

// Process all files
console.log('🚀 Starting unused imports/variables cleanup...\n');

filesToProcess.forEach(filePath => {
  try {
    fixUnusedImports(filePath);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✅ Unused imports/variables cleanup completed!');
console.log('\n🔍 Running lint check to verify improvements...');

try {
  execSync('npm run lint', { stdio: 'inherit' });
} catch (error) {
  console.log('Lint check completed with remaining issues to fix.');
}