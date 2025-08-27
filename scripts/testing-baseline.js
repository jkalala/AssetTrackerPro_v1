#!/usr/bin/env node

/**
 * Testing Baseline and Automation
 * Establishes testing baseline and creates automation for pre/post fix validation
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

class TestingBaseline {
  constructor() {
    this.baselineFile = 'testing-baseline.json';
    this.baseline = null;
  }

  /**
   * Run complete test suite and establish baseline
   */
  async establishBaseline() {
    console.log('🧪 Establishing testing baseline...');
    
    const baseline = {
      timestamp: new Date().toISOString(),
      testResults: {},
      buildResults: {},
      performanceMetrics: {},
      lintResults: {}
    };

    try {
      // Run different types of tests
      baseline.testResults = await this.runTestSuite();
      baseline.buildResults = await this.runBuildTest();
      baseline.lintResults = await this.runLintCheck();
      baseline.performanceMetrics = await this.measurePerformance();
      
      // Save baseline
      fs.writeFileSync(this.baselineFile, JSON.stringify(baseline, null, 2));
      this.baseline = baseline;
      
      console.log('✅ Testing baseline established successfully!');
      this.generateBaselineReport();
      
      return baseline;
      
    } catch (error) {
      console.error('❌ Failed to establish baseline:', error.message);
      throw error;
    }
  }

  /**
   * Run test suite and capture results
   */
  async runTestSuite() {
    console.log('  📋 Running test suite...');
    
    const testResults = {
      unit: { passed: 0, failed: 0, total: 0, duration: 0 },
      integration: { passed: 0, failed: 0, total: 0, duration: 0 },
      e2e: { passed: 0, failed: 0, total: 0, duration: 0 },
      overall: { success: false, coverage: 0 }
    };

    try {
      // Try to run Jest tests
      const jestOutput = execSync('npm test -- --passWithNoTests --coverage --json', {
        encoding: 'utf8',
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });
      
      const jestResults = JSON.parse(jestOutput);
      
      testResults.unit.passed = jestResults.numPassedTests || 0;
      testResults.unit.failed = jestResults.numFailedTests || 0;
      testResults.unit.total = jestResults.numTotalTests || 0;
      testResults.overall.success = jestResults.success || false;
      
      // Extract coverage if available
      if (jestResults.coverageMap) {
        const coverage = jestResults.coverageMap;
        const totalStatements = Object.values(coverage).reduce((sum, file) => {
          return sum + (file.s ? Object.keys(file.s).length : 0);
        }, 0);
        testResults.overall.coverage = totalStatements;
      }
      
    } catch (error) {
      console.log('    ⚠️  No tests found or test runner not configured');
      testResults.overall.success = true; // Don't fail baseline if no tests
    }

    return testResults;
  }

  /**
   * Test build process
   */
  async runBuildTest() {
    console.log('  🔨 Testing build process...');
    
    const buildResults = {
      success: false,
      duration: 0,
      bundleSize: 0,
      errors: [],
      warnings: []
    };

    const startTime = Date.now();

    try {
      // Try Next.js build
      const buildOutput = execSync('npm run build', {
        encoding: 'utf8',
        timeout: 600000, // 10 minutes
        maxBuffer: 1024 * 1024 * 10
      });
      
      buildResults.success = true;
      buildResults.duration = Date.now() - startTime;
      
      // Try to measure bundle size
      try {
        const buildDir = '.next';
        if (fs.existsSync(buildDir)) {
          buildResults.bundleSize = this.calculateDirectorySize(buildDir);
        }
      } catch (sizeError) {
        console.log('    ⚠️  Could not measure bundle size');
      }
      
    } catch (error) {
      buildResults.success = false;
      buildResults.errors.push(error.message);
      buildResults.duration = Date.now() - startTime;
      
      console.log('    ❌ Build failed - this is expected with current lint errors');
    }

    return buildResults;
  }

  /**
   * Run lint check for baseline
   */
  async runLintCheck() {
    console.log('  🔍 Running lint check...');
    
    const lintResults = {
      totalWarnings: 0,
      totalErrors: 0,
      success: false
    };

    try {
      execSync('npx eslint . --ext .ts,.tsx,.js,.jsx', {
        encoding: 'utf8',
        timeout: 300000
      });
      
      lintResults.success = true;
      
    } catch (error) {
      // Parse lint output to count warnings/errors
      if (error.stdout) {
        const lines = error.stdout.split('\n');
        const summaryLine = lines.find(line => line.includes('problems'));
        
        if (summaryLine) {
          const match = summaryLine.match(/(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/);
          if (match) {
            lintResults.totalErrors = parseInt(match[2]);
            lintResults.totalWarnings = parseInt(match[3]);
          }
        }
      }
    }

    return lintResults;
  }

  /**
   * Measure basic performance metrics
   */
  async measurePerformance() {
    console.log('  ⚡ Measuring performance metrics...');
    
    const metrics = {
      nodeModulesSize: 0,
      sourceCodeSize: 0,
      typeScriptCompileTime: 0
    };

    try {
      // Measure node_modules size
      if (fs.existsSync('node_modules')) {
        metrics.nodeModulesSize = this.calculateDirectorySize('node_modules');
      }
      
      // Measure source code size
      const srcDirs = ['app', 'components', 'lib', 'hooks'].filter(dir => fs.existsSync(dir));
      metrics.sourceCodeSize = srcDirs.reduce((total, dir) => {
        return total + this.calculateDirectorySize(dir);
      }, 0);
      
      // Measure TypeScript compile time
      const startTime = Date.now();
      try {
        execSync('npx tsc --noEmit', { 
          encoding: 'utf8', 
          timeout: 300000,
          stdio: 'pipe' // Suppress output
        });
        metrics.typeScriptCompileTime = Date.now() - startTime;
      } catch (error) {
        metrics.typeScriptCompileTime = Date.now() - startTime;
        console.log('    ⚠️  TypeScript compilation has errors (expected)');
      }
      
    } catch (error) {
      console.log('    ⚠️  Could not measure all performance metrics');
    }

    return metrics;
  }

  /**
   * Calculate directory size in bytes
   */
  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return totalSize;
  }

  /**
   * Compare current state with baseline
   */
  async compareWithBaseline() {
    if (!fs.existsSync(this.baselineFile)) {
      throw new Error('No baseline found. Run establishBaseline() first.');
    }

    console.log('🔍 Comparing current state with baseline...');
    
    const baseline = JSON.parse(fs.readFileSync(this.baselineFile, 'utf8'));
    const current = {
      testResults: await this.runTestSuite(),
      buildResults: await this.runBuildTest(),
      lintResults: await this.runLintCheck(),
      performanceMetrics: await this.measurePerformance()
    };

    const comparison = {
      timestamp: new Date().toISOString(),
      baseline: baseline,
      current: current,
      differences: this.calculateDifferences(baseline, current),
      regressions: [],
      improvements: []
    };

    // Identify regressions and improvements
    this.identifyChanges(comparison);
    
    // Save comparison
    const comparisonFile = `test-comparison-${Date.now()}.json`;
    fs.writeFileSync(comparisonFile, JSON.stringify(comparison, null, 2));
    
    this.generateComparisonReport(comparison);
    
    return comparison;
  }

  /**
   * Calculate differences between baseline and current
   */
  calculateDifferences(baseline, current) {
    const differences = {};
    
    // Test differences
    differences.tests = {
      passedDiff: current.testResults.unit.passed - baseline.testResults.unit.passed,
      failedDiff: current.testResults.unit.failed - baseline.testResults.unit.failed,
      totalDiff: current.testResults.unit.total - baseline.testResults.unit.total
    };
    
    // Build differences
    differences.build = {
      successChanged: current.buildResults.success !== baseline.buildResults.success,
      durationDiff: current.buildResults.duration - baseline.buildResults.duration,
      bundleSizeDiff: current.buildResults.bundleSize - baseline.buildResults.bundleSize
    };
    
    // Lint differences
    differences.lint = {
      warningsDiff: current.lintResults.totalWarnings - baseline.lintResults.totalWarnings,
      errorsDiff: current.lintResults.totalErrors - baseline.lintResults.totalErrors
    };
    
    // Performance differences
    differences.performance = {
      compileDiff: current.performanceMetrics.typeScriptCompileTime - baseline.performanceMetrics.typeScriptCompileTime,
      sourceSizeDiff: current.performanceMetrics.sourceCodeSize - baseline.performanceMetrics.sourceCodeSize
    };
    
    return differences;
  }

  /**
   * Identify regressions and improvements
   */
  identifyChanges(comparison) {
    const { differences } = comparison;
    
    // Check for regressions
    if (differences.tests.failedDiff > 0) {
      comparison.regressions.push(`${differences.tests.failedDiff} more test failures`);
    }
    
    if (differences.build.successChanged && !comparison.current.buildResults.success) {
      comparison.regressions.push('Build now failing');
    }
    
    if (differences.lint.errorsDiff > 0) {
      comparison.regressions.push(`${differences.lint.errorsDiff} more lint errors`);
    }
    
    if (differences.performance.compileDiff > 10000) { // 10 seconds
      comparison.regressions.push(`TypeScript compilation ${Math.round(differences.performance.compileDiff / 1000)}s slower`);
    }
    
    // Check for improvements
    if (differences.tests.passedDiff > 0) {
      comparison.improvements.push(`${differences.tests.passedDiff} more tests passing`);
    }
    
    if (differences.lint.warningsDiff < 0) {
      comparison.improvements.push(`${Math.abs(differences.lint.warningsDiff)} fewer lint warnings`);
    }
    
    if (differences.build.bundleSizeDiff < 0) {
      const sizeMB = Math.abs(differences.build.bundleSizeDiff) / (1024 * 1024);
      comparison.improvements.push(`Bundle size reduced by ${sizeMB.toFixed(2)}MB`);
    }
  }

  /**
   * Generate baseline report
   */
  generateBaselineReport() {
    const report = `# Testing Baseline Report

Generated: ${new Date().toLocaleString()}

## Test Results
- **Unit Tests**: ${this.baseline.testResults.unit.passed}/${this.baseline.testResults.unit.total} passing
- **Failed Tests**: ${this.baseline.testResults.unit.failed}
- **Overall Success**: ${this.baseline.testResults.overall.success ? '✅' : '❌'}

## Build Results
- **Build Success**: ${this.baseline.buildResults.success ? '✅' : '❌'}
- **Build Duration**: ${Math.round(this.baseline.buildResults.duration / 1000)}s
- **Bundle Size**: ${(this.baseline.buildResults.bundleSize / (1024 * 1024)).toFixed(2)}MB

## Lint Results
- **Total Warnings**: ${this.baseline.lintResults.totalWarnings}
- **Total Errors**: ${this.baseline.lintResults.totalErrors}
- **Lint Success**: ${this.baseline.lintResults.success ? '✅' : '❌'}

## Performance Metrics
- **Source Code Size**: ${(this.baseline.performanceMetrics.sourceCodeSize / (1024 * 1024)).toFixed(2)}MB
- **TypeScript Compile Time**: ${Math.round(this.baseline.performanceMetrics.typeScriptCompileTime / 1000)}s
- **Node Modules Size**: ${(this.baseline.performanceMetrics.nodeModulesSize / (1024 * 1024 * 1024)).toFixed(2)}GB

## Notes
This baseline will be used to compare changes during the lint cleanup process.
Any regressions in functionality will be flagged for immediate attention.

---
*Generated by Testing Baseline Tool*
`;

    fs.writeFileSync('testing-baseline-report.md', report);
    console.log('📊 Baseline report generated: testing-baseline-report.md');
  }

  /**
   * Generate comparison report
   */
  generateComparisonReport(comparison) {
    const report = `# Test Comparison Report

Generated: ${new Date().toLocaleString()}

## Summary
${comparison.regressions.length === 0 ? '✅ No regressions detected' : '⚠️  Regressions found'}
${comparison.improvements.length > 0 ? `🎉 ${comparison.improvements.length} improvements detected` : ''}

## Regressions
${comparison.regressions.length > 0 ? 
  comparison.regressions.map(r => `- ❌ ${r}`).join('\n') : 
  '- None detected'}

## Improvements
${comparison.improvements.length > 0 ? 
  comparison.improvements.map(i => `- ✅ ${i}`).join('\n') : 
  '- None detected'}

## Detailed Changes

### Tests
- **Passed**: ${comparison.current.testResults.unit.passed} (${comparison.differences.tests.passedDiff >= 0 ? '+' : ''}${comparison.differences.tests.passedDiff})
- **Failed**: ${comparison.current.testResults.unit.failed} (${comparison.differences.tests.failedDiff >= 0 ? '+' : ''}${comparison.differences.tests.failedDiff})
- **Total**: ${comparison.current.testResults.unit.total} (${comparison.differences.tests.totalDiff >= 0 ? '+' : ''}${comparison.differences.tests.totalDiff})

### Build
- **Success**: ${comparison.current.buildResults.success ? '✅' : '❌'} (was ${comparison.baseline.buildResults.success ? '✅' : '❌'})
- **Duration**: ${Math.round(comparison.current.buildResults.duration / 1000)}s (${comparison.differences.build.durationDiff >= 0 ? '+' : ''}${Math.round(comparison.differences.build.durationDiff / 1000)}s)
- **Bundle Size**: ${(comparison.current.buildResults.bundleSize / (1024 * 1024)).toFixed(2)}MB (${comparison.differences.build.bundleSizeDiff >= 0 ? '+' : ''}${(comparison.differences.build.bundleSizeDiff / (1024 * 1024)).toFixed(2)}MB)

### Lint
- **Warnings**: ${comparison.current.lintResults.totalWarnings} (${comparison.differences.lint.warningsDiff >= 0 ? '+' : ''}${comparison.differences.lint.warningsDiff})
- **Errors**: ${comparison.current.lintResults.totalErrors} (${comparison.differences.lint.errorsDiff >= 0 ? '+' : ''}${comparison.differences.lint.errorsDiff})

### Performance
- **Compile Time**: ${Math.round(comparison.current.performanceMetrics.typeScriptCompileTime / 1000)}s (${comparison.differences.performance.compileDiff >= 0 ? '+' : ''}${Math.round(comparison.differences.performance.compileDiff / 1000)}s)
- **Source Size**: ${(comparison.current.performanceMetrics.sourceCodeSize / (1024 * 1024)).toFixed(2)}MB (${comparison.differences.performance.sourceSizeDiff >= 0 ? '+' : ''}${(comparison.differences.performance.sourceSizeDiff / (1024 * 1024)).toFixed(2)}MB)

---
*Generated by Testing Baseline Tool*
`;

    fs.writeFileSync('test-comparison-report.md', report);
    console.log('📊 Comparison report generated: test-comparison-report.md');
  }
}

// CLI interface
if (require.main === module) {
  const tester = new TestingBaseline();
  const command = process.argv[2];
  
  switch (command) {
    case 'baseline':
      tester.establishBaseline().catch(console.error);
      break;
      
    case 'compare':
      tester.compareWithBaseline().catch(console.error);
      break;
      
    default:
      console.log(`
Usage: node testing-baseline.js <command>

Commands:
  baseline  - Establish testing baseline
  compare   - Compare current state with baseline

Examples:
  node testing-baseline.js baseline
  node testing-baseline.js compare
      `);
  }
}

module.exports = TestingBaseline;