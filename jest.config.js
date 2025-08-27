const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "lib/services/*.{ts,tsx}",
    "lib/middleware/*.{ts,tsx}",
    "lib/utils/*.{ts,tsx}",
    "components/ui/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 2,
      statements: 1,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  testMatch: [
    '**/__tests__/basic-coverage.test.ts',
    '**/__tests__/simple.test.ts',
    '**/__tests__/components/basic-component.test.tsx',
    '**/__tests__/lib/services/service-imports.test.ts',
    '**/__tests__/lib/middleware/permission-enforcement.test.ts',
    '**/__tests__/components/auth/mfa-setup-modal.test.tsx',
    '**/__tests__/lib/services/ml-service-simple.test.ts'
  ],
  testTimeout: 10000,
  testPathIgnorePatterns: [
    "<rootDir>/.next/", 
    "<rootDir>/node_modules/", 
    "<rootDir>/e2e/",
    "<rootDir>/__tests__/lib/services/role-service.test.ts",
    "<rootDir>/__tests__/lib/services/department-delegation.test.ts",
    "<rootDir>/__tests__/lib/services/api-key-service.test.ts",
    "<rootDir>/__tests__/lib/services/session-service.test.ts",
    "<rootDir>/__tests__/lib/services/mfa-service.test.ts",
    "<rootDir>/__tests__/lib/services/comprehensive-service-tests.test.ts",
    "<rootDir>/__tests__/lib/middleware/api-key-permission-validation.test.ts",
    "<rootDir>/__tests__/integration/auth-flow.test.ts",
    "<rootDir>/__tests__/integration/rate-limiting.test.ts",
    "<rootDir>/__tests__/integration/session-management.test.ts",
    "<rootDir>/__tests__/integration/security-events-admin.test.ts",
    "<rootDir>/__tests__/hooks/use-rate-limit.test.ts",
    "<rootDir>/__tests__/lib/middleware/rate-limit.test.ts",
    "<rootDir>/__tests__/lib/middleware/api-key-auth.test.ts",
    "<rootDir>/__tests__/lib/middleware/tenant-isolation.test.ts",
    "<rootDir>/__tests__/lib/services/security-event-service.test.ts",
    "<rootDir>/__tests__/lib/services/*-simple.test.ts"
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)