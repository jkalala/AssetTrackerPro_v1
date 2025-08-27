# Lint Analysis Summary

Generated: 27/08/2025, 10:18:15

## Overview
- **Total Warnings**: 1071
- **Estimated Fix Time**: 115 hours

## Risk Distribution
- **Low Risk**: 467 warnings
- **Medium Risk**: 32 warnings  
- **High Risk**: 572 warnings

## Category Breakdown
- **typescript-any**: 534 warnings
- **unused-variables**: 376 warnings
- **html-entities**: 94 warnings
- **react-hooks-deps**: 35 warnings
- **nextjs-links**: 31 warnings
- **error-handling**: 1 warnings

## Top Problematic Files
1. lib\graphql\resolvers\index.ts (31 warnings)
2. lib\types\rbac.ts (26 warnings)
3. app\asset\[assetId]\page.tsx (21 warnings)
4. app\docs\user-guide\page.tsx (21 warnings)
5. components\asset-management.tsx (20 warnings)
6. lib\services\session-service.ts (20 warnings)
7. components\geofence-map-editor.tsx (18 warnings)
8. lib\services\sso-service.ts (17 warnings)
9. lib\middleware\tenant-context.ts (16 warnings)
10. lib\security\rls-utils.ts (16 warnings)

## Recommendations
### unused-variables
- **Priority**: high
- **Action**: Remove 376 unused variables/imports - safe automated fix
- **Time**: 752 minutes

### react-hooks-deps
- **Priority**: high
- **Action**: Fix 35 React hooks dependencies - potential runtime bugs
- **Time**: 525 minutes

### typescript-any
- **Priority**: medium
- **Action**: Replace 534 'any' types with specific types - requires analysis
- **Time**: 5340 minutes

## Next Steps
1. Start with unused variables/imports (low risk, high impact)
2. Fix React hooks dependencies (high priority for stability)
3. Address TypeScript 'any' types (medium priority, improves type safety)
4. Handle Next.js best practices (performance impact)
5. Clean up HTML entities and accessibility issues
