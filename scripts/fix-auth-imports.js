const fs = require('fs');
const path = require('path');

const files = [
  'app/api/analytics/reports/executive-dashboards/route.ts',
  'app/api/analytics/reports/executions/route.ts',
  'app/api/analytics/reports/export/route.ts',
  'app/api/analytics/reports/preview/route.ts',
  'app/api/analytics/reports/templates/route.ts',
  'app/api/analytics/reports/fields/route.ts',
  'app/api/analytics/reports/schedules/route.ts',
  'app/api/analytics/reports/[id]/route.ts',
  'app/api/analytics/reports/[id]/run/route.ts',
  'app/api/analytics/reports/schedules/[id]/route.ts',
  'app/api/analytics/reports/schedules/[id]/run/route.ts'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the import
    content = content.replace(
      /import { getCurrentUser } from '@\/lib\/auth-actions'/g,
      "import { createClient } from '@/lib/supabase/server'"
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in ${filePath}`);
  }
});

console.log('All auth imports fixed!');