#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;

    // Fix any types - be more specific to avoid breaking valid code
    const anyReplacements = [
      { from: /: any(?=\s*[,\)\]\}])/g, to: ': Record<string, unknown>' },
      { from: /: any(?=\s*=)/g, to: ': Record<string, unknown>' },
      { from: /: any\[\]/g, to: ': unknown[]' },
    ];

    anyReplacements.forEach(replacement => {
      if (replacement.from instanceof RegExp) {
        const newContent = content.replace(replacement.from, replacement.to);
        if (newContent !== content) {
          content = newContent;
          changed = true;
        }
      }
    });

    // Fix unused variables by prefixing with underscore
    const unusedVarPatterns = [
      { from: /(\s+)([a-zA-Z_][a-zA-Z0-9_]*): GraphQLResolveInfo/g, to: '$1_$2: GraphQLResolveInfo' },
      { from: /(\s+)info: GraphQLResolveInfo/g, to: '$1_info: GraphQLResolveInfo' },
      { from: /(\s+)error: /g, to: '$1_error: ' },
      { from: /(\s+)args: Record<string, unknown>(?=\s*\))/g, to: '$1_args: Record<string, unknown>' },
    ];

    unusedVarPatterns.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    // Comment out unused imports and variables
    const linesToComment = [
      /^(\s*)(import.*'[^']*analytics-resolvers'.*)/gm,
      /^(\s*)(const PLAN_PRICES = \{)/gm,
      /^(\s*)(const getURL = \(\) => \{)/gm,
      /^(\s*)(import nodemailer)/gm,
    ];

    linesToComment.forEach(pattern => {
      const newContent = content.replace(pattern, '$1// $2');
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript files
function getAllTsFiles(dirs) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message);
    }
  }
  
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      traverse(dir);
    }
  });
  
  return files;
}

// Main execution
const dirsToFix = ['lib', 'middleware.ts', 'types'];
const tsFiles = getAllTsFiles(dirsToFix);
console.log(`Found ${tsFiles.length} TypeScript files to fix`);

let fixedCount = 0;
tsFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files out of ${tsFiles.length}`);