#!/usr/bin/env node

/**
 * Lint Analysis and Categorization Tool
 * Analyzes ESLint output and categorizes warnings for systematic cleanup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lint warning categories
const CATEGORIES = {
  TYPESCRIPT_ANY: 'typescript-any',
  UNUSED_IMPORTS: 'unused-imports',
  UNUSED_VARIABLES: 'unused-variables',
  REACT_HOOKS_DEPS: 'react-hooks-deps',
  NEXTJS_LINKS: 'nextjs-links',
  HTML_ENTITIES: 'html-entities',
  EMPTY_INTERFACES: 'empty-interfaces',
  ERROR_HANDLING: 'error-handling',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE: 'performance'
};

// Risk levels for different file types
const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// File patterns and their risk levels
const FILE_RISK_PATTERNS = {
  // Low risk files
  'lib/types/': RISK_LEVELS.LOW,
  'lib/utils/': RISK_LEVELS.LOW,
  '__tests__/': RISK_LEVELS.LOW,
  'components/ui/': RISK_LEVELS.LOW,
  
  // Medium risk files
  'components/': RISK_LEVELS.MEDIUM,
  'app/api/': RISK_LEVELS.MEDIUM,
  'hooks/': RISK_LEVELS.MEDIUM,
  
  // High risk files
  'lib/services/': RISK_LEVELS.HIGH,
  'lib/middleware/': RISK_LEVELS.HIGH,
  'lib/security/': RISK_LEVELS.HIGH,
  'middleware.ts': RISK_LEVELS.HIGH
};

// Rule categorization mapping
const RULE_CATEGORIES = {
  '@typescript-eslint/no-explicit-any': CATEGORIES.TYPESCRIPT_ANY,
  '@typescript-eslint/no-unused-vars': CATEGORIES.UNUSED_VARIABLES,
  '@typescript-eslint/no-unused-imports': CATEGORIES.UNUSED_IMPORTS,
  'react-hooks/exhaustive-deps': CATEGORIES.REACT_HOOKS_DEPS,
  '@next/next/no-html-link-for-pages': CATEGORIES.NEXTJS_LINKS,
  '@next/next/no-img-element': CATEGORIES.NEXTJS_LINKS,
  'react/no-unescaped-entities': CATEGORIES.HTML_ENTITIES,
  '@typescript-eslint/no-empty-object-type': CATEGORIES.EMPTY_INTERFACES,
  '@typescript-eslint/no-require-imports': CATEGORIES.ERROR_HANDLING,
  '@typescript-eslint/ban-ts-comment': CATEGORIES.ERROR_HANDLING
};

class LintAnalyzer {
  constructor() {
    this.warnings = [];
    this.categorizedWarnings = {};
    this.riskAssessment = {};
  }

  /**
   * Run ESLint and capture output
   */
  runLintAnalysis() {
    console.log('🔍 Running ESLint analysis...');
    
    try {
      // Run ESLint with JSON output
      const lintOutput = execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --format json', {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const results = JSON.parse(lintOutput);
      this.processLintResults(results);
      
    } catch (error) {
      // ESLint returns non-zero exit code when warnings/errors found
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          this.processLintResults(results);
        } catch (parseError) {
          console.error('❌ Failed to parse ESLint output:', parseError.message);
          process.exit(1);
        }
      } else {
        console.error('❌ Failed to run ESLint:', error.message);
        process.exit(1);
      }
    }
  }

  /**
   * Process ESLint results and categorize warnings
   */
  processLintResults(results) {
    console.log('📊 Processing lint results...');
    
    results.forEach(fileResult => {
      const filePath = fileResult.filePath;
      const relativePath = path.relative(process.cwd(), filePath);
      
      fileResult.messages.forEach(message => {
        const warning = {
          file: relativePath,
          line: message.line,
          column: message.column,
          rule: message.ruleId,
          message: message.message,
          severity: message.severity === 2 ? 'error' : 'warning',
          category: this.categorizeRule(message.ruleId),
          riskLevel: this.assessRisk(relativePath, message.ruleId),
          estimatedFixTime: this.estimateFixTime(message.ruleId)
        };
        
        this.warnings.push(warning);
      });
    });
    
    this.categorizeWarnings();
    this.generateRiskAssessment();
  }

  /**
   * Categorize a lint rule
   */
  categorizeRule(ruleId) {
    if (!ruleId) return 'uncategorized';
    
    for (const [rule, category] of Object.entries(RULE_CATEGORIES)) {
      if (ruleId.includes(rule) || rule.includes(ruleId)) {
        return category;
      }
    }
    
    // Additional categorization logic
    if (ruleId.includes('unused')) return CATEGORIES.UNUSED_VARIABLES;
    if (ruleId.includes('react-hooks')) return CATEGORIES.REACT_HOOKS_DEPS;
    if (ruleId.includes('typescript-eslint')) return CATEGORIES.TYPESCRIPT_ANY;
    if (ruleId.includes('next')) return CATEGORIES.NEXTJS_LINKS;
    if (ruleId.includes('accessibility') || ruleId.includes('a11y')) return CATEGORIES.ACCESSIBILITY;
    
    return 'other';
  }

  /**
   * Assess risk level for a file and rule combination
   */
  assessRisk(filePath, ruleId) {
    // Check file-based risk patterns
    for (const [pattern, riskLevel] of Object.entries(FILE_RISK_PATTERNS)) {
      if (filePath.includes(pattern)) {
        return riskLevel;
      }
    }
    
    // Rule-based risk assessment
    const highRiskRules = [
      'react-hooks/exhaustive-deps',
      '@typescript-eslint/no-explicit-any'
    ];
    
    const lowRiskRules = [
      '@typescript-eslint/no-unused-vars',
      'react/no-unescaped-entities'
    ];
    
    if (highRiskRules.some(rule => ruleId?.includes(rule))) {
      return RISK_LEVELS.HIGH;
    }
    
    if (lowRiskRules.some(rule => ruleId?.includes(rule))) {
      return RISK_LEVELS.LOW;
    }
    
    return RISK_LEVELS.MEDIUM;
  }

  /**
   * Estimate fix time in minutes
   */
  estimateFixTime(ruleId) {
    const timeEstimates = {
      '@typescript-eslint/no-unused-vars': 2,
      'react/no-unescaped-entities': 1,
      '@typescript-eslint/no-explicit-any': 10,
      'react-hooks/exhaustive-deps': 15,
      '@next/next/no-html-link-for-pages': 5,
      '@next/next/no-img-element': 8
    };
    
    for (const [rule, time] of Object.entries(timeEstimates)) {
      if (ruleId?.includes(rule)) {
        return time;
      }
    }
    
    return 5; // Default estimate
  }

  /**
   * Group warnings by category
   */
  categorizeWarnings() {
    this.categorizedWarnings = {};
    
    this.warnings.forEach(warning => {
      const category = warning.category;
      if (!this.categorizedWarnings[category]) {
        this.categorizedWarnings[category] = [];
      }
      this.categorizedWarnings[category].push(warning);
    });
  }

  /**
   * Generate risk assessment summary
   */
  generateRiskAssessment() {
    const riskCounts = { low: 0, medium: 0, high: 0 };
    const categoryCounts = {};
    
    this.warnings.forEach(warning => {
      riskCounts[warning.riskLevel]++;
      categoryCounts[warning.category] = (categoryCounts[warning.category] || 0) + 1;
    });
    
    this.riskAssessment = {
      totalWarnings: this.warnings.length,
      riskDistribution: riskCounts,
      categoryDistribution: categoryCounts,
      estimatedTotalFixTime: this.warnings.reduce((total, w) => total + w.estimatedFixTime, 0)
    };
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.riskAssessment,
      categorizedWarnings: this.categorizedWarnings,
      topFiles: this.getTopProblematicFiles(),
      recommendations: this.generateRecommendations()
    };
    
    // Save detailed report
    fs.writeFileSync(
      'lint-analysis-report.json',
      JSON.stringify(report, null, 2)
    );
    
    // Generate human-readable summary
    this.generateSummaryReport(report);
    
    console.log('📋 Analysis complete! Reports generated:');
    console.log('  - lint-analysis-report.json (detailed)');
    console.log('  - lint-summary-report.md (readable)');
  }

  /**
   * Get files with most warnings
   */
  getTopProblematicFiles() {
    const fileCounts = {};
    
    this.warnings.forEach(warning => {
      fileCounts[warning.file] = (fileCounts[warning.file] || 0) + 1;
    });
    
    return Object.entries(fileCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([file, count]) => ({ file, count }));
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Category-based recommendations
    Object.entries(this.categorizedWarnings).forEach(([category, warnings]) => {
      const count = warnings.length;
      
      switch (category) {
        case CATEGORIES.UNUSED_VARIABLES:
          recommendations.push({
            category,
            priority: 'high',
            action: `Remove ${count} unused variables/imports - safe automated fix`,
            estimatedTime: `${count * 2} minutes`
          });
          break;
          
        case CATEGORIES.TYPESCRIPT_ANY:
          recommendations.push({
            category,
            priority: 'medium',
            action: `Replace ${count} 'any' types with specific types - requires analysis`,
            estimatedTime: `${count * 10} minutes`
          });
          break;
          
        case CATEGORIES.REACT_HOOKS_DEPS:
          recommendations.push({
            category,
            priority: 'high',
            action: `Fix ${count} React hooks dependencies - potential runtime bugs`,
            estimatedTime: `${count * 15} minutes`
          });
          break;
      }
    });
    
    return recommendations;
  }

  /**
   * Generate human-readable summary report
   */
  generateSummaryReport(report) {
    const summary = `# Lint Analysis Summary

Generated: ${new Date().toLocaleString()}

## Overview
- **Total Warnings**: ${report.summary.totalWarnings}
- **Estimated Fix Time**: ${Math.round(report.summary.estimatedTotalFixTime / 60)} hours

## Risk Distribution
- **Low Risk**: ${report.summary.riskDistribution.low} warnings
- **Medium Risk**: ${report.summary.riskDistribution.medium} warnings  
- **High Risk**: ${report.summary.riskDistribution.high} warnings

## Category Breakdown
${Object.entries(report.summary.categoryDistribution)
  .sort(([,a], [,b]) => b - a)
  .map(([category, count]) => `- **${category}**: ${count} warnings`)
  .join('\n')}

## Top Problematic Files
${report.topFiles.slice(0, 10)
  .map((item, i) => `${i + 1}. ${item.file} (${item.count} warnings)`)
  .join('\n')}

## Recommendations
${report.recommendations
  .map(rec => `### ${rec.category}\n- **Priority**: ${rec.priority}\n- **Action**: ${rec.action}\n- **Time**: ${rec.estimatedTime}`)
  .join('\n\n')}

## Next Steps
1. Start with unused variables/imports (low risk, high impact)
2. Fix React hooks dependencies (high priority for stability)
3. Address TypeScript 'any' types (medium priority, improves type safety)
4. Handle Next.js best practices (performance impact)
5. Clean up HTML entities and accessibility issues
`;

    fs.writeFileSync('lint-summary-report.md', summary);
  }
}

// Main execution
if (require.main === module) {
  console.log('🚀 Starting Lint Analysis Tool...');
  
  const analyzer = new LintAnalyzer();
  analyzer.runLintAnalysis();
  analyzer.generateReport();
  
  console.log('✅ Lint analysis completed successfully!');
}

module.exports = LintAnalyzer;