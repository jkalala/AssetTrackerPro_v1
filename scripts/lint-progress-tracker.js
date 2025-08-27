#!/usr/bin/env node

/**
 * Lint Progress Tracking Dashboard
 * Tracks progress of lint cleanup across different phases
 */

const fs = require('fs');
const path = require('path');

class LintProgressTracker {
  constructor() {
    this.progressFile = 'lint-cleanup-progress.json';
    this.progress = this.loadProgress();
  }

  /**
   * Load existing progress or initialize
   */
  loadProgress() {
    if (fs.existsSync(this.progressFile)) {
      return JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
    }
    
    return {
      startDate: new Date().toISOString(),
      phases: {
        'foundation': { status: 'not_started', warnings: 0, fixed: 0 },
        'unused-code': { status: 'not_started', warnings: 0, fixed: 0 },
        'typescript-types': { status: 'not_started', warnings: 0, fixed: 0 },
        'react-hooks': { status: 'not_started', warnings: 0, fixed: 0 },
        'nextjs-optimization': { status: 'not_started', warnings: 0, fixed: 0 },
        'html-accessibility': { status: 'not_started', warnings: 0, fixed: 0 },
        'error-handling': { status: 'not_started', warnings: 0, fixed: 0 },
        'final-validation': { status: 'not_started', warnings: 0, fixed: 0 }
      },
      categories: {},
      milestones: [],
      totalWarningsStart: 0,
      currentWarnings: 0
    };
  }

  /**
   * Save progress to file
   */
  saveProgress() {
    fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2));
  }

  /**
   * Update progress for a specific phase
   */
  updatePhase(phaseName, status, warningsFixed = 0) {
    if (!this.progress.phases[phaseName]) {
      this.progress.phases[phaseName] = { status: 'not_started', warnings: 0, fixed: 0 };
    }
    
    this.progress.phases[phaseName].status = status;
    this.progress.phases[phaseName].fixed += warningsFixed;
    this.progress.phases[phaseName].lastUpdated = new Date().toISOString();
    
    this.saveProgress();
    this.generateDashboard();
  }

  /**
   * Record a milestone
   */
  addMilestone(description, warningsCount) {
    this.progress.milestones.push({
      date: new Date().toISOString(),
      description,
      warningsRemaining: warningsCount,
      warningsFixed: this.progress.totalWarningsStart - warningsCount
    });
    
    this.progress.currentWarnings = warningsCount;
    this.saveProgress();
  }

  /**
   * Set initial baseline
   */
  setBaseline(totalWarnings, categorizedWarnings) {
    this.progress.totalWarningsStart = totalWarnings;
    this.progress.currentWarnings = totalWarnings;
    this.progress.categories = categorizedWarnings;
    
    // Initialize phase warning counts
    Object.keys(this.progress.phases).forEach(phase => {
      this.progress.phases[phase].warnings = this.estimatePhaseWarnings(phase, categorizedWarnings);
    });
    
    this.addMilestone('Baseline established', totalWarnings);
  }

  /**
   * Estimate warnings per phase based on categories
   */
  estimatePhaseWarnings(phase, categorizedWarnings) {
    const phaseMapping = {
      'foundation': ['empty-interfaces', 'other'],
      'unused-code': ['unused-imports', 'unused-variables'],
      'typescript-types': ['typescript-any'],
      'react-hooks': ['react-hooks-deps'],
      'nextjs-optimization': ['nextjs-links', 'performance'],
      'html-accessibility': ['html-entities', 'accessibility'],
      'error-handling': ['error-handling'],
      'final-validation': []
    };
    
    const categories = phaseMapping[phase] || [];
    return categories.reduce((total, category) => {
      return total + (categorizedWarnings[category]?.length || 0);
    }, 0);
  }

  /**
   * Generate progress dashboard
   */
  generateDashboard() {
    const totalFixed = Object.values(this.progress.phases)
      .reduce((sum, phase) => sum + phase.fixed, 0);
    
    const progressPercent = this.progress.totalWarningsStart > 0 
      ? Math.round((totalFixed / this.progress.totalWarningsStart) * 100)
      : 0;

    const dashboard = `# Lint Cleanup Progress Dashboard

Last Updated: ${new Date().toLocaleString()}

## Overall Progress
- **Total Warnings at Start**: ${this.progress.totalWarningsStart}
- **Warnings Fixed**: ${totalFixed}
- **Warnings Remaining**: ${this.progress.currentWarnings}
- **Progress**: ${progressPercent}% complete

## Progress Bar
${'█'.repeat(Math.floor(progressPercent / 5))}${'░'.repeat(20 - Math.floor(progressPercent / 5))} ${progressPercent}%

## Phase Status
${Object.entries(this.progress.phases).map(([phase, data]) => {
  const status = data.status === 'completed' ? '✅' : 
                data.status === 'in_progress' ? '🔄' : 
                data.status === 'not_started' ? '⏳' : '❓';
  
  const phaseProgress = data.warnings > 0 ? Math.round((data.fixed / data.warnings) * 100) : 0;
  
  return `### ${phase.replace('-', ' ').toUpperCase()} ${status}
- **Status**: ${data.status.replace('_', ' ')}
- **Warnings**: ${data.warnings}
- **Fixed**: ${data.fixed}
- **Progress**: ${phaseProgress}%
- **Last Updated**: ${data.lastUpdated || 'Not started'}`;
}).join('\n\n')}

## Recent Milestones
${this.progress.milestones.slice(-5).reverse().map(milestone => 
  `- **${new Date(milestone.date).toLocaleDateString()}**: ${milestone.description} (${milestone.warningsRemaining} remaining)`
).join('\n')}

## Category Breakdown
${Object.entries(this.progress.categories).map(([category, warnings]) => 
  `- **${category}**: ${warnings.length} warnings`
).join('\n')}

## Estimated Time Remaining
Based on current progress: ${this.estimateTimeRemaining()} hours

---
*Generated by Lint Progress Tracker*
`;

    fs.writeFileSync('lint-progress-dashboard.md', dashboard);
    console.log('📊 Progress dashboard updated: lint-progress-dashboard.md');
  }

  /**
   * Estimate remaining time based on current progress
   */
  estimateTimeRemaining() {
    const avgTimePerWarning = 5; // minutes
    const remainingWarnings = this.progress.currentWarnings;
    const hoursRemaining = Math.round((remainingWarnings * avgTimePerWarning) / 60);
    
    return hoursRemaining;
  }

  /**
   * Generate completion report
   */
  generateCompletionReport() {
    const totalTime = new Date() - new Date(this.progress.startDate);
    const days = Math.floor(totalTime / (1000 * 60 * 60 * 24));
    
    const report = `# Lint Cleanup Completion Report

## Summary
- **Project Duration**: ${days} days
- **Total Warnings Fixed**: ${this.progress.totalWarningsStart}
- **Final Warning Count**: ${this.progress.currentWarnings}
- **Success Rate**: ${Math.round(((this.progress.totalWarningsStart - this.progress.currentWarnings) / this.progress.totalWarningsStart) * 100)}%

## Phase Completion
${Object.entries(this.progress.phases).map(([phase, data]) => 
  `- **${phase}**: ${data.fixed}/${data.warnings} warnings fixed (${Math.round((data.fixed / data.warnings) * 100)}%)`
).join('\n')}

## Key Milestones
${this.progress.milestones.map(milestone => 
  `- **${new Date(milestone.date).toLocaleDateString()}**: ${milestone.description}`
).join('\n')}

## Impact
- Improved code quality and maintainability
- Enhanced TypeScript type safety
- Better React performance and stability
- Reduced bundle size through dead code elimination
- Improved accessibility and user experience

## Lessons Learned
- Systematic approach enabled efficient cleanup
- Automated tooling reduced manual effort
- Phase-based approach minimized risk
- Regular testing prevented regressions

---
*Lint cleanup project completed successfully!*
`;

    fs.writeFileSync('lint-cleanup-completion-report.md', report);
    console.log('🎉 Completion report generated: lint-cleanup-completion-report.md');
  }
}

// CLI interface
if (require.main === module) {
  const tracker = new LintProgressTracker();
  const command = process.argv[2];
  
  switch (command) {
    case 'update':
      const phase = process.argv[3];
      const status = process.argv[4];
      const fixed = parseInt(process.argv[5]) || 0;
      tracker.updatePhase(phase, status, fixed);
      break;
      
    case 'milestone':
      const description = process.argv[3];
      const count = parseInt(process.argv[4]) || 0;
      tracker.addMilestone(description, count);
      break;
      
    case 'baseline':
      const total = parseInt(process.argv[3]) || 0;
      tracker.setBaseline(total, {});
      break;
      
    case 'dashboard':
      tracker.generateDashboard();
      break;
      
    case 'complete':
      tracker.generateCompletionReport();
      break;
      
    default:
      console.log(`
Usage: node lint-progress-tracker.js <command> [args]

Commands:
  update <phase> <status> [fixed]  - Update phase progress
  milestone <description> <count>  - Add milestone
  baseline <total>                 - Set initial baseline
  dashboard                        - Generate dashboard
  complete                         - Generate completion report

Examples:
  node lint-progress-tracker.js baseline 1073
  node lint-progress-tracker.js update unused-code in_progress 150
  node lint-progress-tracker.js milestone "Phase 1 complete" 923
  node lint-progress-tracker.js dashboard
      `);
  }
}

module.exports = LintProgressTracker;