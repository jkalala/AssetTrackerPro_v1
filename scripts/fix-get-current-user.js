const fs = require('fs');
const path = require('path');

const files = [
  'app/api/analytics/reports/[id]/route.ts',
  'app/api/analytics/reports/[id]/run/route.ts',
  'app/api/analytics/reports/executions/route.ts',
  'app/api/analytics/reports/executive-dashboards/route.ts',
  'app/api/analytics/reports/export/route.ts',
  'app/api/analytics/reports/fields/route.ts',
  'app/api/analytics/reports/preview/route.ts',
  'app/api/analytics/reports/route.ts',
  'app/api/analytics/reports/schedules/[id]/route.ts',
  'app/api/analytics/reports/schedules/[id]/run/route.ts',
  'app/api/analytics/reports/schedules/route.ts',
  'app/api/analytics/reports/templates/route.ts'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace getCurrentUser calls with Supabase client auth
    content = content.replace(
      /const user = await getCurrentUser\(\)/g,
      `const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }`
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed getCurrentUser calls in ${filePath}`);
  }
});

console.log('All getCurrentUser calls fixed!');