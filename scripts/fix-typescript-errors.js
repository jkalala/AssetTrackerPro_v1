#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the specific TypeScript errors introduced by the previous script
const fixes = [
  // Fix tenant-provisioning.ts errors
  {
    file: 'lib/services/tenant-provisioning.ts',
    fixes: [
      { from: /request\._name/g, to: 'request.name' },
      { from: /_tenantId/g, to: 'tenantId' },
      { from: /_userId/g, to: 'userId' },
      { from: /_options/g, to: 'options' },
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
    ]
  },
  
  // Fix tenant-service.ts errors
  {
    file: 'lib/services/tenant-service.ts',
    fixes: [
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
      { from: /_userId/g, to: 'userId' },
      { from: /tenant\?/g, to: 'tenant' },
    ]
  },
  
  // Fix sso-service.ts errors
  {
    file: 'lib/services/sso-service.ts',
    fixes: [
      { from: /_tenantId/g, to: 'tenantId' },
      { from: /_userId/g, to: 'userId' },
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
    ]
  },
  
  // Fix supabase/middleware.ts errors
  {
    file: 'lib/supabase/middleware.ts',
    fixes: [
      { from: /_name/g, to: 'name' },
      { from: /_options/g, to: 'options' },
    ]
  },
  
  // Fix utils/api-rate-limit.ts errors
  {
    file: 'lib/utils/api-rate-limit.ts',
    fixes: [
      { from: /_options/g, to: 'options' },
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
    ]
  },
  
  // Fix utils/form-validation.ts errors
  {
    file: 'lib/utils/form-validation.ts',
    fixes: [
      { from: /} catch \(_err\) {[\s\S]*?if \(error instanceof/g, to: '} catch (error) {\n    if (error instanceof' },
    ]
  },
  
  // Fix utils/permission-cache.ts errors
  {
    file: 'lib/utils/permission-cache.ts',
    fixes: [
      { from: /_tenantId/g, to: 'tenantId' },
      { from: /_userId/g, to: 'userId' },
      { from: /userKey/g, to: 'userKey' },
    ]
  },
  
  // Fix webhook-utils.ts errors
  {
    file: 'lib/webhook-utils.ts',
    fixes: [
      { from: /_event/g, to: 'event' },
    ]
  },
  
  // Fix middleware.ts errors
  {
    file: 'middleware.ts',
    fixes: [
      { from: /retryAfter/g, to: 'rateLimitResult.retryAfter' },
      { from: /_tenant/g, to: 'tenant' },
      { from: /} catch \(_error\) {[\s\S]*?console\.error\([^)]+, error\)/g, to: '} catch (error) {\n      console.error' },
      { from: /_details/g, to: 'details' },
    ]
  }
];

function applyFixes() {
  console.log('🔧 Fixing TypeScript errors introduced by previous script...\n');
  
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
      console.log(`✅ Fixed TypeScript errors in ${file}`);
    } else {
      console.log(`ℹ️  No fixes needed in ${file}`);
    }
  });
  
  console.log('\n✅ TypeScript error fixes completed!');
}

applyFixes();