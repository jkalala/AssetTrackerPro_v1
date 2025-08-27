#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Critical TypeScript fixes that will have high impact
const fixes = [
  // Fix permission-service.ts errors
  {
    file: 'lib/services/permission-service.ts',
    fixes: [
      // Fix variable name issues
      { from: /_tenantId/g, to: 'tenantId' },
      { from: /_userId/g, to: 'userId' },
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
      { from: /const days = /g, to: 'const _days = ' },
      { from: /const query = /g, to: 'const _query = ' },
    ]
  },
  
  // Fix reporting-service.ts errors
  {
    file: 'lib/services/reporting-service.ts',
    fixes: [
      { from: /_tenantId/g, to: 'tenantId' },
      { from: /_userId/g, to: 'userId' },
      { from: /const query = /g, to: 'const _query = ' },
      { from: /field\._name/g, to: 'field.name' },
      { from: /col\._type/g, to: 'col.type' },
      { from: /const headers = /g, to: 'const _headers = ' },
      { from: /const mimeType = /g, to: 'const _mimeType = ' },
    ]
  },
  
  // Fix role-service.ts errors
  {
    file: 'lib/services/role-service.ts',
    fixes: [
      { from: /_tenantId/g, to: 'tenantId' },
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
      { from: /const query = /g, to: 'const _query = ' },
      { from: /const userCountMap = /g, to: 'const _userCountMap = ' },
      { from: /const days = /g, to: 'const _days = ' },
    ]
  },
  
  // Fix sso-service.ts errors
  {
    file: 'lib/services/sso-service.ts',
    fixes: [
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
      { from: /const query = /g, to: 'const _query = ' },
      { from: /_sessionId/g, to: 'sessionId' },
      { from: /const config = /g, to: 'const _config = ' },
    ]
  },
  
  // Fix tenant-service.ts errors
  {
    file: 'lib/services/tenant-service.ts',
    fixes: [
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
      { from: /const tenant = /g, to: 'const _tenant = ' },
      { from: /const query = /g, to: 'const _query = ' },
    ]
  },
  
  // Fix form-validation.ts errors
  {
    file: 'lib/utils/form-validation.ts',
    fixes: [
      { from: /} catch \(_err\) {[\s\S]*?if \(error instanceof/g, to: '} catch (error) {\n    if (error instanceof' },
    ]
  },
  
  // Fix permission-cache.ts errors
  {
    file: 'lib/utils/permission-cache.ts',
    fixes: [
      { from: /const userKey = /g, to: 'const _userKey = ' },
    ]
  }
];

function applyFixes() {
  console.log('🚀 Applying critical TypeScript error fixes...\n');
  
  fixes.forEach(({ file, fixes: fileFixes }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  File ${file} does not exist, skipping...`);
      return;
    }
    
    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    fileFixes.forEach(({ from, to }) => {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`✅ Applied critical fixes to ${file}`);
    } else {
      console.log(`ℹ️  No critical fixes needed in ${file}`);
    }
  });
  
  console.log('\n✅ Critical TypeScript error fixes completed!');
}

applyFixes();