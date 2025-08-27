#!/usr/bin/env node

/**
 * Rollback Procedure for Lint Cleanup
 * Provides safe rollback mechanisms during the cleanup process
 */

const fs = require('fs');
const { execSync } = require('child_process');

class RollbackProcedure {
  constructor() {
    this.rollbackLog = 'rollback-log.json';
    this.checkpoints = this.loadCheckpoints();
  }

  /**
   * Load existing checkpoints
   */
  loadCheckpoints() {
    if (fs.existsSync(this.rollbackLog)) {
      return JSON.parse(fs.readFileSync(this.rollbackLog, 'utf8'));
    }
    
    return {
      checkpoints: [],
      currentPhase: null,
      lastSafePoint: null
    };
  }

  /**
   * Save checkpoints
   */
  saveCheckpoints() {
    fs.writeFileSync(this.rollbackLog, JSON.stringify(this.checkpoints, null, 2));
  }

  /**
   * Create a checkpoint before starting a phase
   */
  createCheckpoint(phaseName, description) {
    console.log(`📍 Creating checkpoint for ${phaseName}...`);
    
    try {
      // Get current git status
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      const hasUncommittedChanges = gitStatus.trim().length > 0;
      
      if (hasUncommittedChanges) {
        console.log('⚠️  Uncommitted changes detected. Committing current state...');
        execSync('git add .');
        execSync(`git commit -m "Checkpoint: ${phaseName} - ${description}"`);
      }
      
      // Create git tag for easy rollback
      const tagName = `lint-cleanup-${phaseName}-${Date.now()}`;
      execSync(`git tag ${tagName}`);
      
      const checkpoint = {
        id: Date.now(),
        phaseName,
        description,
        timestamp: new Date().toISOString(),
        gitTag: tagName,
        gitCommit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        testResults: null // Will be populated if tests are run
      };
      
      this.checkpoints.checkpoints.push(checkpoint);
      this.checkpoints.currentPhase = phaseName;
      this.checkpoints.lastSafePoint = checkpoint.id;
      
      this.saveCheckpoints();
      
      console.log(`✅ Checkpoint created: ${tagName}`);
      return checkpoint;
      
    } catch (error) {
      console.error('❌ Failed to create checkpoint:', error.message);
      throw error;
    }
  }

  /**
   * Rollback to a specific checkpoint
   */
  rollbackToCheckpoint(checkpointId) {
    const checkpoint = this.checkpoints.checkpoints.find(cp => cp.id === checkpointId);
    
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }
    
    console.log(`🔄 Rolling back to checkpoint: ${checkpoint.phaseName}`);
    console.log(`   Description: ${checkpoint.description}`);
    console.log(`   Created: ${new Date(checkpoint.timestamp).toLocaleString()}`);
    
    try {
      // Confirm rollback
      console.log('⚠️  This will discard all changes since the checkpoint.');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      
      // Wait 5 seconds for user to cancel
      execSync('timeout 5 2>nul || sleep 5', { stdio: 'inherit' });
      
      // Reset to checkpoint
      execSync(`git reset --hard ${checkpoint.gitCommit}`);
      
      // Clean untracked files
      execSync('git clean -fd');
      
      console.log('✅ Rollback completed successfully');
      
      // Update current state
      this.checkpoints.currentPhase = checkpoint.phaseName;
      this.saveCheckpoints();
      
      return checkpoint;
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  /**
   * Rollback to last safe point
   */
  rollbackToLastSafe() {
    if (!this.checkpoints.lastSafePoint) {
      throw new Error('No safe checkpoint found');
    }
    
    return this.rollbackToCheckpoint(this.checkpoints.lastSafePoint);
  }

  /**
   * List all available checkpoints
   */
  listCheckpoints() {
    console.log('📋 Available Checkpoints:');
    console.log('='.repeat(60));
    
    if (this.checkpoints.checkpoints.length === 0) {
      console.log('No checkpoints found.');
      return;
    }
    
    this.checkpoints.checkpoints.forEach((checkpoint, index) => {
      const isCurrent = checkpoint.id === this.checkpoints.lastSafePoint;
      const marker = isCurrent ? '👉' : '  ';
      
      console.log(`${marker} ${index + 1}. ${checkpoint.phaseName}`);
      console.log(`     ID: ${checkpoint.id}`);
      console.log(`     Description: ${checkpoint.description}`);
      console.log(`     Created: ${new Date(checkpoint.timestamp).toLocaleString()}`);
      console.log(`     Git Tag: ${checkpoint.gitTag}`);
      console.log('');
    });
  }

  /**
   * Validate current state against checkpoint
   */
  validateState(checkpointId) {
    const checkpoint = this.checkpoints.checkpoints.find(cp => cp.id === checkpointId);
    
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }
    
    console.log(`🔍 Validating current state against checkpoint: ${checkpoint.phaseName}`);
    
    try {
      // Check git status
      const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const isAtCheckpoint = currentCommit === checkpoint.gitCommit;
      
      // Check for uncommitted changes
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      const hasUncommittedChanges = gitStatus.trim().length > 0;
      
      // Run basic validation
      const validation = {
        atCheckpoint: isAtCheckpoint,
        hasUncommittedChanges,
        currentCommit,
        checkpointCommit: checkpoint.gitCommit,
        canRollback: true,
        issues: []
      };
      
      if (!isAtCheckpoint && !hasUncommittedChanges) {
        validation.issues.push('Current commit differs from checkpoint but no uncommitted changes');
      }
      
      if (hasUncommittedChanges) {
        validation.issues.push('Uncommitted changes detected - commit or stash before rollback');
      }
      
      console.log('Validation Results:');
      console.log(`  At Checkpoint: ${validation.atCheckpoint ? '✅' : '❌'}`);
      console.log(`  Uncommitted Changes: ${validation.hasUncommittedChanges ? '⚠️' : '✅'}`);
      console.log(`  Can Rollback: ${validation.canRollback ? '✅' : '❌'}`);
      
      if (validation.issues.length > 0) {
        console.log('  Issues:');
        validation.issues.forEach(issue => console.log(`    - ${issue}`));
      }
      
      return validation;
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Create emergency backup
   */
  createEmergencyBackup() {
    console.log('🚨 Creating emergency backup...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupBranch = `emergency-backup-${timestamp}`;
      
      // Create backup branch
      execSync(`git checkout -b ${backupBranch}`);
      
      // Commit current state
      execSync('git add .');
      execSync(`git commit -m "Emergency backup - ${timestamp}" --allow-empty`);
      
      // Return to original branch
      execSync('git checkout -');
      
      console.log(`✅ Emergency backup created: ${backupBranch}`);
      
      return {
        branch: backupBranch,
        timestamp,
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
      };
      
    } catch (error) {
      console.error('❌ Emergency backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate rollback report
   */
  generateRollbackReport() {
    const report = `# Rollback Procedure Report

Generated: ${new Date().toLocaleString()}

## Current State
- **Current Phase**: ${this.checkpoints.currentPhase || 'Not set'}
- **Last Safe Point**: ${this.checkpoints.lastSafePoint || 'None'}
- **Total Checkpoints**: ${this.checkpoints.checkpoints.length}

## Available Checkpoints
${this.checkpoints.checkpoints.map((cp, index) => `
### ${index + 1}. ${cp.phaseName}
- **ID**: ${cp.id}
- **Description**: ${cp.description}
- **Created**: ${new Date(cp.timestamp).toLocaleString()}
- **Git Tag**: ${cp.gitTag}
- **Git Commit**: ${cp.gitCommit.substring(0, 8)}
`).join('')}

## Rollback Commands
To rollback to a specific checkpoint:
\`\`\`bash
node scripts/rollback-procedure.js rollback <checkpoint-id>
\`\`\`

To rollback to last safe point:
\`\`\`bash
node scripts/rollback-procedure.js rollback-safe
\`\`\`

To create emergency backup:
\`\`\`bash
node scripts/rollback-procedure.js emergency-backup
\`\`\`

## Manual Rollback (if script fails)
1. List git tags: \`git tag | grep lint-cleanup\`
2. Reset to tag: \`git reset --hard <tag-name>\`
3. Clean untracked files: \`git clean -fd\`

---
*Generated by Rollback Procedure Tool*
`;

    fs.writeFileSync('rollback-report.md', report);
    console.log('📊 Rollback report generated: rollback-report.md');
  }
}

// CLI interface
if (require.main === module) {
  const rollback = new RollbackProcedure();
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'checkpoint':
      const phaseName = arg;
      const description = process.argv[4] || 'Manual checkpoint';
      rollback.createCheckpoint(phaseName, description);
      break;
      
    case 'rollback':
      const checkpointId = parseInt(arg);
      rollback.rollbackToCheckpoint(checkpointId);
      break;
      
    case 'rollback-safe':
      rollback.rollbackToLastSafe();
      break;
      
    case 'list':
      rollback.listCheckpoints();
      break;
      
    case 'validate':
      const validateId = parseInt(arg);
      rollback.validateState(validateId);
      break;
      
    case 'emergency-backup':
      rollback.createEmergencyBackup();
      break;
      
    case 'report':
      rollback.generateRollbackReport();
      break;
      
    default:
      console.log(`
Usage: node rollback-procedure.js <command> [args]

Commands:
  checkpoint <phase> [description]  - Create checkpoint
  rollback <checkpoint-id>          - Rollback to checkpoint
  rollback-safe                     - Rollback to last safe point
  list                              - List all checkpoints
  validate <checkpoint-id>          - Validate current state
  emergency-backup                  - Create emergency backup
  report                            - Generate rollback report

Examples:
  node rollback-procedure.js checkpoint unused-code "Starting unused code cleanup"
  node rollback-procedure.js list
  node rollback-procedure.js rollback 1756285626148
  node rollback-procedure.js rollback-safe
      `);
  }
}

module.exports = RollbackProcedure;