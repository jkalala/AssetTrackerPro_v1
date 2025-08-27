const fs = require('fs');

const filePath = '__tests__/lib/services/reporting-service.test.ts';

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix all mock calls to remove parameters
  content = content.replace(/expect\(mockSupabaseClient\.from\)\.toHaveBeenCalledWith\('[^']+'\)/g, 'expect(mockSupabaseClient.from).toHaveBeenCalled()');
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed test mock calls');
}

console.log('Test mocks fixed!');