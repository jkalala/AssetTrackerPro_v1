#!/usr/bin/env node

/**
 * Fix Unused Variables
 * Automatically fixes unused variables by removing them or prefixing with underscore
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class UnusedVariablesFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
    this.fixedCount = 0;
  }

  /**
   * Fix unused variables across all files
   */
  async fixUnusedVariables() {
    console.log('🔧 Fixing unused variables...');
    
    // First, let's get a list of all unused variable warnings
    const unusedVarWarnings = await this.getUnusedVariableWarnings();
    console.log(`Found ${unusedVarWarnings.length} unused variable warnings`);
    
    // Group warnings by file
    const warningsByFile = this.groupWarningsByFile(unusedVarWarnings);
    
    // Fix each file
    for (const [filePath, warnings] of Object.entries(warningsByFile)) {
      try {
        await this.fixFileUnusedVariables(filePath, warnings);
      } catch (error) {
        this.errors.push({ file: filePath, error: error.message });
        console.log(`  ❌ Error fixing ${filePath}: ${error.message}`);
      }
    }
    
    console.log(`🎉 Fixed ${this.fixedCount} unused variables in ${this.fixedFiles.length} files`);
  }

  /**
   * Get unused variable warnings from ESLint
   */
  async getUnusedVariableWarnings() {
    try {
      const output = execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --format json', {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10
      });
      
      const results = JSON.parse(output);
      const warnings = [];
      
      results.forEach(fileResult => {
        const filePath = path.relative(process.cwd(), fileResult.filePath);
        
        fileResult.messages.forEach(message => {
          if (message.ruleId === '@typescript-eslint/no-unused-vars') {
            warnings.push({
              file: filePath,
              line: message.line,
              column: message.column,
              message: message.message,
              severity: message.severity
            });
          }
        });
      });
      
      return warnings;
      
    } catch (error) {
      // ESLint returns non-zero exit code when warnings found
      if (error.stdout) {
        const results = JSON.parse(error.stdout);
        const warnings = [];
        
        results.forEach(fileResult => {
          const filePath = path.relative(process.cwd(), fileResult.filePath);
          
          fileResult.messages.forEach(message => {
            if (message.ruleId === '@typescript-eslint/no-unused-vars') {
              warnings.push({
                file: filePath,
                line: message.line,
                column: message.column,
                message: message.message,
                severity: message.severity
              });
            }
          });
        });
        
        return warnings;
      }
      throw error;
    }
  }

  /**
   * Group warnings by file
   */
  groupWarningsByFile(warnings) {
    const grouped = {};
    
    warnings.forEach(warning => {
      if (!grouped[warning.file]) {
        grouped[warning.file] = [];
      }
      grouped[warning.file].push(warning);
    });
    
    return grouped;
  }

  /**
   * Fix unused variables in a specific file
   */
  async fixFileUnusedVariables(filePath, warnings) {
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return;
    }
    
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    let fileFixed = false;
    
    // Sort warnings by line number (descending) to avoid line number shifts
    warnings.sort((a, b) => b.line - a.line);
    
    for (const warning of warnings) {
      const fix = this.generateFix(content, warning);
      if (fix) {
        content = fix.newContent;
        fileFixed = true;
        this.fixedCount++;
        console.log(`  ✅ ${filePath}:${warning.line} - ${fix.description}`);
      }
    }
    
    if (fileFixed) {
      fs.writeFileSync(filePath, content);
      this.fixedFiles.push(filePath);
    }
  }

  /**
   * Generate a fix for a specific unused variable warning
   */
  generateFix(content, warning) {
    const lines = content.split('\n');
    const lineIndex = warning.line - 1;
    
    if (lineIndex >= lines.length) {
      return null;
    }
    
    const line = lines[lineIndex];
    const message = warning.message;
    
    // Extract variable name from message
    const varNameMatch = message.match(/'([^']+)' is (?:defined but never used|assigned a value but never used)/);
    if (!varNameMatch) {
      return null;
    }
    
    const varName = varNameMatch[1];
    
    // Different strategies based on the context
    if (message.includes('is defined but never used')) {
      return this.fixUnusedDefinition(lines, lineIndex, varName, warning);
    } else if (message.includes('is assigned a value but never used')) {
      return this.fixUnusedAssignment(lines, lineIndex, varName, warning);
    }
    
    return null;
  }

  /**
   * Fix unused variable definitions (imports, function parameters, etc.)
   */
  fixUnusedDefinition(lines, lineIndex, varName, warning) {
    const line = lines[lineIndex];
    
    // Handle import statements
    if (line.trim().startsWith('import')) {
      return this.fixUnusedImport(lines, lineIndex, varName);
    }
    
    // Handle function parameters
    if (line.includes('=>') || line.includes('function') || line.includes('catch')) {
      return this.fixUnusedParameter(lines, lineIndex, varName);
    }
    
    // Handle variable declarations
    if (line.includes('const ') || line.includes('let ') || line.includes('var ')) {
      return this.fixUnusedVariableDeclaration(lines, lineIndex, varName);
    }
    
    return null;
  }

  /**
   * Fix unused assignments
   */
  fixUnusedAssignment(lines, lineIndex, varName, warning) {
    const line = lines[lineIndex];
    
    // For unused assignments, we can either remove the line or prefix with underscore
    // Let's be conservative and just prefix with underscore
    const newLine = line.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
    
    if (newLine !== line) {
      lines[lineIndex] = newLine;
      return {
        newContent: lines.join('\n'),
        description: `Prefixed unused variable '${varName}' with underscore`
      };
    }
    
    return null;
  }

  /**
   * Fix unused imports
   */
  fixUnusedImport(lines, lineIndex, varName) {
    const line = lines[lineIndex];
    
    // Handle named imports: import { foo, bar } from 'module'
    const namedImportMatch = line.match(/import\s*\{([^}]+)\}\s*from/);
    if (namedImportMatch) {
      const imports = namedImportMatch[1].split(',').map(s => s.trim());
      const filteredImports = imports.filter(imp => {
        const cleanImp = imp.replace(/\s+as\s+\w+/, '').trim();
        return cleanImp !== varName;
      });
      
      if (filteredImports.length === 0) {
        // Remove entire import line
        lines.splice(lineIndex, 1);
        return {
          newContent: lines.join('\n'),
          description: `Removed entire unused import line`
        };
      } else if (filteredImports.length < imports.length) {
        // Remove just the unused import
        const newImports = filteredImports.join(', ');
        const newLine = line.replace(/\{[^}]+\}/, `{${newImports}}`);
        lines[lineIndex] = newLine;
        return {
          newContent: lines.join('\n'),
          description: `Removed unused import '${varName}'`
        };
      }
    }
    
    // Handle default imports: import Foo from 'module'
    if (line.includes(`import ${varName} from`)) {
      lines.splice(lineIndex, 1);
      return {
        newContent: lines.join('\n'),
        description: `Removed unused default import '${varName}'`
      };
    }
    
    return null;
  }

  /**
   * Fix unused parameters
   */
  fixUnusedParameter(lines, lineIndex, varName) {
    const line = lines[lineIndex];
    
    // Prefix parameter with underscore to indicate it's intentionally unused
    const newLine = line.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
    
    if (newLine !== line) {
      lines[lineIndex] = newLine;
      return {
        newContent: lines.join('\n'),
        description: `Prefixed unused parameter '${varName}' with underscore`
      };
    }
    
    return null;
  }

  /**
   * Fix unused variable declarations
   */
  fixUnusedVariableDeclaration(lines, lineIndex, varName) {
    const line = lines[lineIndex];
    
    // If it's a simple variable declaration that's not used, we can remove it
    // But be careful with destructuring and complex expressions
    
    if (line.trim().match(new RegExp(`^(const|let|var)\\s+${varName}\\s*=`))) {
      // Simple variable declaration - remove the line
      lines.splice(lineIndex, 1);
      return {
        newContent: lines.join('\n'),
        description: `Removed unused variable declaration '${varName}'`
      };
    }
    
    // For complex cases, just prefix with underscore
    const newLine = line.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
    if (newLine !== line) {
      lines[lineIndex] = newLine;
      return {
        newContent: lines.join('\n'),
        description: `Prefixed unused variable '${varName}' with underscore`
      };
    }
    
    return null;
  }

  /**
   * Generate report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      fixedFiles: this.fixedFiles,
      errorFiles: this.errors,
      summary: {
        totalFilesFixed: this.fixedFiles.length,
        totalVariablesFixed: this.fixedCount,
        totalErrors: this.errors.length
      }
    };
    
    fs.writeFileSync('unused-variables-fix-report.json', JSON.stringify(report, null, 2));
    
    const markdownReport = `# Unused Variables Fix Report

Generated: ${new Date().toLocaleString()}

## Summary
- **Files Fixed**: ${report.summary.totalFilesFixed}
- **Variables Fixed**: ${report.summary.totalVariablesFixed}
- **Errors**: ${report.summary.totalErrors}

## Fixed Files
${this.fixedFiles.map(file => `- ${file}`).join('\n')}

## Errors
${this.errors.map(error => `- **${error.file}**: ${error.error}`).join('\n')}

---
*Generated by Unused Variables Fixer*
`;

    fs.writeFileSync('unused-variables-fix-report.md', markdownReport);
    
    console.log('📊 Fix report generated:');
    console.log('  - unused-variables-fix-report.json (detailed)');
    console.log('  - unused-variables-fix-report.md (readable)');
  }
}

// CLI interface
if (require.main === module) {
  const fixer = new UnusedVariablesFixer();
  
  console.log('🚀 Starting unused variables cleanup...');
  
  fixer.fixUnusedVariables()
    .then(() => {
      fixer.generateReport();
      console.log('✅ Unused variables cleanup completed!');
      
      if (fixer.errors.length > 0) {
        console.log(`⚠️  ${fixer.errors.length} files had errors`);
      }
    })
    .catch(error => {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    });
}

module.exports = UnusedVariablesFixer;