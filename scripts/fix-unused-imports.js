#!/usr/bin/env node

/**
 * Fix Unused Imports
 * Automatically removes unused imports from TypeScript and JavaScript files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class UnusedImportsFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
  }

  /**
   * Fix unused imports using ESLint's auto-fix capability
   */
  async fixUnusedImports() {
    console.log('🔧 Fixing unused imports...');
    
    try {
      // Use ESLint's --fix flag to automatically remove unused imports
      const result = execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --fix --rule "@typescript-eslint/no-unused-vars: error"', {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10,
        stdio: 'pipe'
      });
      
      console.log('✅ ESLint auto-fix completed');
      
    } catch (error) {
      // ESLint returns non-zero exit code when there are unfixable issues
      console.log('⚠️  ESLint completed with some unfixable issues (expected)');
    }
    
    // Now let's manually fix some specific patterns that ESLint might miss
    await this.manuallyFixUnusedImports();
  }

  /**
   * Manually fix unused imports that ESLint auto-fix might miss
   */
  async manuallyFixUnusedImports() {
    console.log('🔍 Manually checking for additional unused imports...');
    
    const files = this.getAllTSFiles();
    let fixedCount = 0;
    
    for (const file of files) {
      try {
        const originalContent = fs.readFileSync(file, 'utf8');
        const fixedContent = this.removeUnusedImports(originalContent, file);
        
        if (originalContent !== fixedContent) {
          fs.writeFileSync(file, fixedContent);
          this.fixedFiles.push(file);
          fixedCount++;
          console.log(`  ✅ Fixed: ${file}`);
        }
        
      } catch (error) {
        this.errors.push({ file, error: error.message });
        console.log(`  ❌ Error fixing ${file}: ${error.message}`);
      }
    }
    
    console.log(`🎉 Manually fixed ${fixedCount} additional files`);
  }

  /**
   * Get all TypeScript and JavaScript files
   */
  getAllTSFiles() {
    const files = [];
    
    const searchDirs = [
      'app',
      'components', 
      'lib',
      'hooks',
      '__tests__'
    ].filter(dir => fs.existsSync(dir));
    
    const walkDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other build directories
          if (!['node_modules', '.next', 'dist', 'build', 'coverage'].includes(item)) {
            walkDir(fullPath);
          }
        } else if (stat.isFile()) {
          // Include TypeScript and JavaScript files
          if (/\.(ts|tsx|js|jsx)$/.test(item) && !item.endsWith('.d.ts')) {
            files.push(fullPath);
          }
        }
      }
    };
    
    searchDirs.forEach(walkDir);
    return files;
  }

  /**
   * Remove unused imports from file content
   */
  removeUnusedImports(content, filePath) {
    const lines = content.split('\n');
    const imports = [];
    const usedIdentifiers = new Set();
    
    // First pass: collect all imports and used identifiers
    lines.forEach((line, index) => {
      // Match import statements
      const importMatch = line.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?\s*$/);
      if (importMatch) {
        imports.push({
          line: index,
          fullLine: line,
          importClause: importMatch[1],
          module: importMatch[2]
        });
      }
      
      // Collect all identifiers used in the file (simple approach)
      const identifiers = line.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g);
      if (identifiers) {
        identifiers.forEach(id => usedIdentifiers.add(id));
      }
    });
    
    // Second pass: determine which imports are unused
    const linesToRemove = new Set();
    
    imports.forEach(importInfo => {
      const { line, importClause, module } = importInfo;
      
      // Skip certain modules that might have side effects
      const sideEffectModules = [
        '@testing-library/jest-dom',
        'jest-dom',
        './globals.css',
        './app/globals.css'
      ];
      
      if (sideEffectModules.some(mod => module.includes(mod))) {
        return;
      }
      
      // Parse import clause to extract imported identifiers
      const importedIds = this.parseImportClause(importClause);
      
      // Check if any imported identifier is used
      const isUsed = importedIds.some(id => {
        // Remove quotes and clean up the identifier
        const cleanId = id.replace(/['"]/g, '').trim();
        return usedIdentifiers.has(cleanId);
      });
      
      if (!isUsed) {
        linesToRemove.add(line);
        console.log(`    Removing unused import: ${importClause} from ${module}`);
      }
    });
    
    // Third pass: remove unused import lines
    const filteredLines = lines.filter((line, index) => !linesToRemove.has(index));
    
    return filteredLines.join('\n');
  }

  /**
   * Parse import clause to extract imported identifiers
   */
  parseImportClause(importClause) {
    const identifiers = [];
    
    // Handle default imports: import Foo from 'module'
    const defaultMatch = importClause.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (defaultMatch) {
      identifiers.push(defaultMatch[1]);
    }
    
    // Handle named imports: import { foo, bar } from 'module'
    const namedMatch = importClause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      const namedImports = namedMatch[1].split(',').map(s => s.trim());
      namedImports.forEach(namedImport => {
        // Handle aliases: import { foo as bar }
        const aliasMatch = namedImport.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (aliasMatch) {
          identifiers.push(aliasMatch[2]); // Use the alias name
        } else {
          identifiers.push(namedImport);
        }
      });
    }
    
    // Handle namespace imports: import * as foo from 'module'
    const namespaceMatch = importClause.match(/\*\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (namespaceMatch) {
      identifiers.push(namespaceMatch[1]);
    }
    
    return identifiers;
  }

  /**
   * Generate report of fixes
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      fixedFiles: this.fixedFiles,
      errorFiles: this.errors,
      summary: {
        totalFilesFixed: this.fixedFiles.length,
        totalErrors: this.errors.length
      }
    };
    
    fs.writeFileSync('unused-imports-fix-report.json', JSON.stringify(report, null, 2));
    
    const markdownReport = `# Unused Imports Fix Report

Generated: ${new Date().toLocaleString()}

## Summary
- **Files Fixed**: ${report.summary.totalFilesFixed}
- **Errors**: ${report.summary.totalErrors}

## Fixed Files
${this.fixedFiles.map(file => `- ${file}`).join('\n')}

## Errors
${this.errors.map(error => `- **${error.file}**: ${error.error}`).join('\n')}

---
*Generated by Unused Imports Fixer*
`;

    fs.writeFileSync('unused-imports-fix-report.md', markdownReport);
    
    console.log('📊 Fix report generated:');
    console.log('  - unused-imports-fix-report.json (detailed)');
    console.log('  - unused-imports-fix-report.md (readable)');
  }
}

// CLI interface
if (require.main === module) {
  const fixer = new UnusedImportsFixer();
  
  console.log('🚀 Starting unused imports cleanup...');
  
  fixer.fixUnusedImports()
    .then(() => {
      fixer.generateReport();
      console.log('✅ Unused imports cleanup completed!');
      console.log(`📈 Fixed ${fixer.fixedFiles.length} files`);
      
      if (fixer.errors.length > 0) {
        console.log(`⚠️  ${fixer.errors.length} files had errors`);
      }
    })
    .catch(error => {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    });
}

module.exports = UnusedImportsFixer;