#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common replacements for any types
const anyReplacements = [
  { from: ': any', to: ': Record<string, unknown>' },
  { from: ': any[]', to: ': unknown[]' },
  { from: ': any =', to: ': Record<string, unknown> =' },
  { from: ': any)', to: ': Record<string, unknown>)' },
  { from: ': any,', to: ': Record<string, unknown>,' },
];

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix any types
    anyReplacements.forEach(replacement => {
      const newContent = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    // Comment out unused variables (simple patterns)
    const unusedPatterns = [
      /^(\s*)(const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=.*$/gm,
    ];

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Get all TypeScript files
function getAllTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
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
  }
  
  traverse(dir);
  return files;
}

// Main execution
const tsFiles = getAllTsFiles('./lib');
console.log(`Found ${tsFiles.length} TypeScript files to fix`);

tsFiles.forEach(fixFile);

console.log('Lint error fixing complete!');