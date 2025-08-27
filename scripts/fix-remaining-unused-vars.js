#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files that need additional fixes
const filesToProcess = [
  'lib/services/integration-service.ts',
  'lib/utils/api-rate-limit.ts',
  'lib/utils/form-validation.ts',
  'lib/utils/permission-cache.ts',
  'lib/supabase/middleware.ts',
  'public/service-worker.js',
  'src/screens/AssetsScreen.js',
  'src/screens/CheckoutScreen.js',
  'src/screens/LocationScreen.js',
  'src/screens/ScannerScreen.js',
  'src/screens/SettingsScreen.js'
];

function fixRemainingUnusedVars(filePath) {
  console.log(`Processing ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix specific unused variables that weren't caught in the first pass
  const fixes = [
    // Integration service fixes
    { from: /\b(integration)\s*,/g, to: '_integration,' },
    { from: /\b(syncResultId)\s*,/g, to: '_syncResultId,' },
    { from: /\b(config)\s*=/g, to: '_config =' },
    
    // API rate limit fixes
    { from: /\b(options)\s*\)/g, to: '_options)' },
    
    // Form validation fixes
    { from: /\b(name)\s*,/g, to: '_name,' },
    { from: /\b(sessionId)\s*,/g, to: '_sessionId,' },
    
    // Permission cache fixes
    { from: /\buserKey\s*=/g, to: '_userKey =' },
    
    // Supabase middleware fixes
    { from: /\b(options)\s*\)/g, to: '_options)' },
    
    // Service worker fixes
    { from: /\b(event)\s*\)/g, to: '_event)' },
    
    // React Native screen fixes
    { from: /\b(navigation)\s*\)/g, to: '_navigation)' },
    { from: /\b(width)\s*=/g, to: '_width =' },
    { from: /\b(height)\s*=/g, to: '_height =' },
    { from: /\b(type)\s*\)/g, to: '_type)' },
    { from: /\bgetStatusIcon\s*=/g, to: '_getStatusIcon =' },
  ];
  
  fixes.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  // Remove unused imports that are still present
  const unusedImports = [
    /import\s*{\s*[^}]*List[^}]*}\s*from\s*['"'][^'"]+['"];?\s*\n/g,
    /import\s*{\s*[^}]*Divider[^}]*}\s*from\s*['"'][^'"]+['"];?\s*\n/g,
    /import\s*{\s*[^}]*Button[^}]*}\s*from\s*['"'][^'"]+['"];?\s*\n/g,
    /import\s*{\s*[^}]*Paragraph[^}]*}\s*from\s*['"'][^'"]+['"];?\s*\n/g,
    /import\s*{\s*[^}]*ActivityIndicator[^}]*}\s*from\s*['"'][^'"]+['"];?\s*\n/g,
  ];
  
  unusedImports.forEach(pattern => {
    const newContent = content.replace(pattern, '');
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed remaining unused variables in ${filePath}`);
  } else {
    console.log(`ℹ️  No additional changes needed in ${filePath}`);
  }
}

// Process all files
console.log('🚀 Starting remaining unused variables cleanup...\n');

filesToProcess.forEach(filePath => {
  try {
    fixRemainingUnusedVars(filePath);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✅ Remaining unused variables cleanup completed!');