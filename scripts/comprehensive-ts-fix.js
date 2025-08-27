#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;

    // Fix _error property issues - replace with error
    const errorReplacements = [
      { from: /_error:/g, to: 'error:' },
      { from: /_error\s*=/g, to: 'error =' },
      { from: /_error\s*\?/g, to: 'error?' },
    ];

    errorReplacements.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    // Fix Supabase destructuring issues
    const supabaseReplacements = [
      { from: /const\s*{\s*data:\s*([^,}]+),\s*_error:\s*([^}]+)\s*}/g, to: 'const { data: $1, error: $2 }' },
      { from: /const\s*{\s*_error:\s*([^}]+)\s*}/g, to: 'const { error: $1 }' },
    ];

    supabaseReplacements.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    // Fix type assertions for database objects
    const typeAssertions = [
      { from: /(\w+)\.(\w+)\s*as\s*(\w+)/g, to: '($1.$2 as $3)' },
    ];

    // Add type assertions for unknown database fields
    const dbFieldFixes = [
      { from: /dbWebhook\.id,/g, to: 'dbWebhook.id as string,' },
      { from: /dbWebhook\.tenant_id,/g, to: 'dbWebhook.tenant_id as string,' },
      { from: /dbWebhook\.name,/g, to: 'dbWebhook.name as string,' },
      { from: /dbWebhook\.url,/g, to: 'dbWebhook.url as string,' },
      { from: /dbWebhook\.events,/g, to: 'dbWebhook.events as string[],' },
      { from: /dbWebhook\.secret,/g, to: 'dbWebhook.secret as string,' },
      { from: /dbWebhook\.is_active,/g, to: 'dbWebhook.is_active as boolean,' },
      { from: /dbWebhook\.retry_policy,/g, to: 'dbWebhook.retry_policy as RetryPolicy,' },
      { from: /dbWebhook\.created_at\)/g, to: 'dbWebhook.created_at as string)' },
      { from: /dbWebhook\.updated_at\)/g, to: 'dbWebhook.updated_at as string)' },
      { from: /dbDelivery\.id,/g, to: 'dbDelivery.id as string,' },
      { from: /dbDelivery\.webhook_id,/g, to: 'dbDelivery.webhook_id as string,' },
      { from: /dbDelivery\.event_type,/g, to: 'dbDelivery.event_type as string,' },
      { from: /dbDelivery\.status,/g, to: 'dbDelivery.status as WebhookDeliveryStatus,' },
      { from: /dbDelivery\.response_code,/g, to: 'dbDelivery.response_code as number,' },
      { from: /dbDelivery\.response_body,/g, to: 'dbDelivery.response_body as string,' },
      { from: /dbDelivery\.attempt_number,/g, to: 'dbDelivery.attempt_number as number,' },
      { from: /dbDelivery\.delivered_at\s*\?\s*new Date\(dbDelivery\.delivered_at\)/g, to: 'dbDelivery.delivered_at ? new Date(dbDelivery.delivered_at as string)' },
      { from: /dbDelivery\.next_retry_at\s*\?\s*new Date\(dbDelivery\.next_retry_at\)/g, to: 'dbDelivery.next_retry_at ? new Date(dbDelivery.next_retry_at as string)' },
      { from: /dbDelivery\.created_at\)/g, to: 'dbDelivery.created_at as string)' },
    ];

    dbFieldFixes.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    // Fix baseQuery type issues
    const queryFixes = [
      { from: /baseQuery\.eq\(/g, to: '(baseQuery as any).eq(' },
      { from: /baseQuery\.or\(/g, to: '(baseQuery as any).or(' },
    ];

    queryFixes.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    // Fix enhance-api-with-rate-limit handler type
    if (filePath.includes('enhance-api-with-rate-limit.ts')) {
      const handlerFix = { 
        from: /result\[method\] = enhanceWithRateLimit\(handler, methodOptions as RateLimitOptions\);/g, 
        to: 'result[method] = enhanceWithRateLimit(handler as any, methodOptions as RateLimitOptions);' 
      };
      const newContent = content.replace(handlerFix.from, handlerFix.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }

    // Fix tenant null checks
    const nullCheckFixes = [
      { from: /tenant\.branding/g, to: 'tenant?.branding' },
      { from: /tenant\.feature_flags/g, to: 'tenant?.feature_flags' },
      { from: /tenant\.settings/g, to: 'tenant?.settings' },
      { from: /tenant\.plan/g, to: 'tenant?.plan' },
    ];

    nullCheckFixes.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript files
function getAllTsFiles(dirs) {
  const files = [];
  
  function traverse(currentDir) {
    try {
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
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message);
    }
  }
  
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      if (fs.statSync(dir).isDirectory()) {
        traverse(dir);
      } else if (dir.endsWith('.ts') || dir.endsWith('.tsx')) {
        files.push(dir);
      }
    }
  });
  
  return files;
}

// Main execution
const dirsToFix = ['lib', 'app', 'components', 'hooks', 'middleware.ts'];
const tsFiles = getAllTsFiles(dirsToFix);
console.log(`Found ${tsFiles.length} TypeScript files to fix`);

let fixedCount = 0;
tsFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files out of ${tsFiles.length}`);