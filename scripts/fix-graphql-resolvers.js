#!/usr/bin/env node

const fs = require('fs');

// Read the file
const filePath = 'lib/graphql/resolvers/index.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all patterns
content = content
  // Replace any types
  .replace(/: any(?=[,\)\s])/g, ': Record<string, unknown>')
  // Replace unused info parameters
  .replace(/info: GraphQLResolveInfo/g, '_info: GraphQLResolveInfo')
  // Replace unused underscore parameters that are still named
  .replace(/(\s+)_: Record<string, unknown>,(\s+)args: Record<string, unknown>,/g, '$1_: Record<string, unknown>,$2args: Record<string, unknown>,')
  // Fix specific patterns for GraphQL resolvers
  .replace(/parent: Record<string, unknown>/g, 'parent: Record<string, unknown>')
  .replace(/args: Record<string, unknown>/g, 'args: Record<string, unknown>')
  .replace(/context: ResolverContext/g, 'context: ResolverContext');

// Write back to file
fs.writeFileSync(filePath, content);

console.log('Fixed GraphQL resolvers index.ts');