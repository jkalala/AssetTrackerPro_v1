#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with React hooks dependency issues
const filesToProcess = [
  'src/screens/AssetsScreen.js',
  'src/screens/CheckoutScreen.js',
  'src/screens/LocationScreen.js'
];

function fixReactHooksDeps(filePath) {
  console.log(`Processing ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix specific useEffect dependency issues
  const fixes = [
    // AssetsScreen.js - add filterAssets to dependency array
    {
      from: /useEffect\(\(\) => \{\s*filterAssets\(\);\s*\}, \[\]\);/g,
      to: 'useEffect(() => {\n    filterAssets();\n  }, [filterAssets]);'
    },
    
    // CheckoutScreen.js - add filterAssets to dependency array
    {
      from: /useEffect\(\(\) => \{\s*filterAssets\(\);\s*\}, \[\]\);/g,
      to: 'useEffect(() => {\n    filterAssets();\n  }, [filterAssets]);'
    },
    
    // LocationScreen.js - add checkLocationPermission to dependency array
    {
      from: /useEffect\(\(\) => \{\s*checkLocationPermission\(\);\s*\}, \[\]\);/g,
      to: 'useEffect(() => {\n    checkLocationPermission();\n  }, [checkLocationPermission]);'
    },
    
    // LocationScreen.js - add loadNearbyAssets to dependency array
    {
      from: /useEffect\(\(\) => \{\s*if \(hasLocationPermission\) \{\s*loadNearbyAssets\(\);\s*\}\s*\}, \[hasLocationPermission\]\);/g,
      to: 'useEffect(() => {\n    if (hasLocationPermission) {\n      loadNearbyAssets();\n    }\n  }, [hasLocationPermission, loadNearbyAssets]);'
    }
  ];
  
  fixes.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  // Alternative approach - wrap functions in useCallback to stabilize references
  if (filePath.includes('AssetsScreen.js')) {
    // Add useCallback import if not present
    if (!content.includes('useCallback')) {
      content = content.replace(
        /import React, \{ ([^}]+) \} from 'react'/,
        'import React, { $1, useCallback } from \'react\''
      );
      modified = true;
    }
    
    // Wrap filterAssets in useCallback
    const filterAssetsPattern = /const filterAssets = \(\) => \{[\s\S]*?\};/;
    if (filterAssetsPattern.test(content)) {
      content = content.replace(
        filterAssetsPattern,
        (match) => `const filterAssets = useCallback(() => {${match.slice(24, -2)}}, [searchQuery, selectedCategory, assets]);`
      );
      modified = true;
    }
  }
  
  if (filePath.includes('CheckoutScreen.js')) {
    // Add useCallback import if not present
    if (!content.includes('useCallback')) {
      content = content.replace(
        /import React, \{ ([^}]+) \} from 'react'/,
        'import React, { $1, useCallback } from \'react\''
      );
      modified = true;
    }
    
    // Wrap filterAssets in useCallback
    const filterAssetsPattern = /const filterAssets = \(\) => \{[\s\S]*?\};/;
    if (filterAssetsPattern.test(content)) {
      content = content.replace(
        filterAssetsPattern,
        (match) => `const filterAssets = useCallback(() => {${match.slice(24, -2)}}, [searchQuery, assets]);`
      );
      modified = true;
    }
  }
  
  if (filePath.includes('LocationScreen.js')) {
    // Add useCallback import if not present
    if (!content.includes('useCallback')) {
      content = content.replace(
        /import React, \{ ([^}]+) \} from 'react'/,
        'import React, { $1, useCallback } from \'react\''
      );
      modified = true;
    }
    
    // Wrap functions in useCallback
    const checkLocationPermissionPattern = /const checkLocationPermission = async \(\) => \{[\s\S]*?\};/;
    if (checkLocationPermissionPattern.test(content)) {
      content = content.replace(
        checkLocationPermissionPattern,
        (match) => `const checkLocationPermission = useCallback(async () => {${match.slice(37, -2)}}, []);`
      );
      modified = true;
    }
    
    const loadNearbyAssetsPattern = /const loadNearbyAssets = async \(\) => \{[\s\S]*?\};/;
    if (loadNearbyAssetsPattern.test(content)) {
      content = content.replace(
        loadNearbyAssetsPattern,
        (match) => `const loadNearbyAssets = useCallback(async () => {${match.slice(32, -2)}}, [location]);`
      );
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed React hooks dependencies in ${filePath}`);
  } else {
    console.log(`ℹ️  No React hooks dependency fixes needed in ${filePath}`);
  }
}

// Process all files
console.log('🚀 Starting React hooks dependency fixes...\n');

filesToProcess.forEach(filePath => {
  try {
    fixReactHooksDeps(filePath);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✅ React hooks dependency fixes completed!');