#!/usr/bin/env node

/**
 * Run Initial Lint Analysis
 * Executes the complete lint analysis and sets up progress tracking
 */

const LintAnalyzer = require('./lint-analysis');
const LintProgressTracker = require('./lint-progress-tracker');

async function runInitialAnalysis() {
  console.log('🚀 Starting comprehensive lint analysis...\n');
  
  try {
    // Step 1: Run lint analysis
    console.log('Step 1: Analyzing current lint warnings...');
    const analyzer = new LintAnalyzer();
    analyzer.runLintAnalysis();
    analyzer.generateReport();
    
    // Step 2: Set up progress tracking
    console.log('\nStep 2: Setting up progress tracking...');
    const tracker = new LintProgressTracker();
    tracker.setBaseline(
      analyzer.riskAssessment.totalWarnings,
      analyzer.categorizedWarnings
    );
    
    // Step 3: Generate initial dashboard
    console.log('\nStep 3: Generating progress dashboard...');
    tracker.generateDashboard();
    
    // Step 4: Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 LINT ANALYSIS COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total Warnings Found: ${analyzer.riskAssessment.totalWarnings}`);
    console.log(`Estimated Fix Time: ${Math.round(analyzer.riskAssessment.estimatedTotalFixTime / 60)} hours`);
    console.log('\nRisk Distribution:');
    console.log(`  Low Risk:    ${analyzer.riskAssessment.riskDistribution.low} warnings`);
    console.log(`  Medium Risk: ${analyzer.riskAssessment.riskDistribution.medium} warnings`);
    console.log(`  High Risk:   ${analyzer.riskAssessment.riskDistribution.high} warnings`);
    
    console.log('\nTop Categories:');
    const sortedCategories = Object.entries(analyzer.riskAssessment.categoryDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    sortedCategories.forEach(([category, count]) => {
      console.log(`  ${category}: ${count} warnings`);
    });
    
    console.log('\nFiles Generated:');
    console.log('  📋 lint-analysis-report.json - Detailed analysis data');
    console.log('  📄 lint-summary-report.md - Human-readable summary');
    console.log('  📊 lint-progress-dashboard.md - Progress tracking dashboard');
    console.log('  💾 lint-cleanup-progress.json - Progress data');
    
    console.log('\n🎯 Ready to start cleanup! Recommended order:');
    console.log('  1. Start with unused variables/imports (low risk, quick wins)');
    console.log('  2. Fix React hooks dependencies (high impact on stability)');
    console.log('  3. Address TypeScript any types (improves type safety)');
    console.log('  4. Handle Next.js best practices (performance gains)');
    console.log('  5. Clean up HTML entities and accessibility');
    
    console.log('\n✅ Analysis setup complete! You can now begin the cleanup process.');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure ESLint is installed: npm install eslint');
    console.error('  2. Check ESLint configuration exists');
    console.error('  3. Verify project dependencies are installed');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runInitialAnalysis();
}

module.exports = runInitialAnalysis;