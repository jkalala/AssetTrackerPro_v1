/**
 * Enterprise-Grade Jest Configuration for AssetTrackerPro
 * Designed for Government, Enterprise, and Educational Institutions
 *
 * Features:
 * - 95% code coverage requirement
 * - Multi-environment testing
 * - Security and compliance testing
 * - Performance testing integration
 * - Audit trail validation
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Enterprise-grade Jest configuration
const enterpriseJestConfig = {
  // Test Environment Configuration
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/testing/setup/jest.setup.js',
    '<rootDir>/testing/setup/enterprise.setup.js',
    '<rootDir>/testing/setup/security.setup.js',
    '<rootDir>/testing/setup/compliance.setup.js',
  ],

  // Module Resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@testing/(.*)$': '<rootDir>/testing/$1',
    '^@fixtures/(.*)$': '<rootDir>/testing/fixtures/$1',
    '^@mocks/(.*)$': '<rootDir>/testing/mocks/$1',
  },

  // Test File Patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/tests/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],

  // Test Categories
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/load-tests/',
    '<rootDir>/security-tests/',
  ],

  // Coverage Configuration - Enterprise Standards
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'middleware/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/testing/**',
    '!**/*.config.*',
    '!**/demo/**',
    '!**/preview/**',
  ],

  // Enterprise Coverage Thresholds
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Critical modules require 98% coverage
    './lib/services/': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    './lib/middleware/': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    './app/api/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Coverage Reporting
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'cobertura', // For enterprise CI/CD systems
    'clover', // For SonarQube integration
  ],
  coverageDirectory: 'coverage',

  // Test Execution Configuration
  testTimeout: 30000, // 30 seconds for complex enterprise tests
  maxWorkers: process.env.CI ? 2 : '50%',

  // Retry Configuration for Flaky Tests
  retry: process.env.CI ? 2 : 0,

  // Test Results Processing
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: 'test-results',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'AssetTrackerPro Test Report',
      },
    ],
  ],

  // Global Test Configuration
  globals: {
    'ts-jest': {
      useESM: true,
    },
    __DEV__: true,
    __TEST__: true,
    __ENTERPRISE__: true,
  },

  // Transform Configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Module File Extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test Environment Options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // Snapshot Configuration
  snapshotSerializers: ['enzyme-to-json/serializer'],

  // Watch Configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/test-results/',
  ],

  // Error Handling
  errorOnDeprecated: true,
  verbose: true,

  // Custom Test Environments for Different Test Types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/**/*.unit.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jest-environment-jsdom',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/**/*.integration.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jest-environment-node',
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/testing/security/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jest-environment-node',
    },
    {
      displayName: 'compliance',
      testMatch: ['<rootDir>/testing/compliance/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jest-environment-node',
    },
  ],
}

module.exports = createJestConfig(enterpriseJestConfig)
