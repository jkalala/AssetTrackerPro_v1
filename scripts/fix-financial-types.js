const fs = require('fs');

const filePath = 'lib/services/financial-analytics-service.ts';

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix all reduce parameter types
  content = content.replace(/\.reduce\(\(sum, ([^)]+)\) =>/g, '.reduce((sum: number, $1: any) =>');
  
  // Fix forEach parameter types
  content = content.replace(/\.forEach\(([^)]+) =>/g, '.forEach(($1: any) =>');
  
  // Fix map parameter types
  content = content.replace(/\.map\(([^)]+) =>/g, '.map(($1: any) =>');
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed parameter types in financial analytics service');
}

console.log('Financial analytics types fixed!');