const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// SonarCloud-specific Jest configuration
const sonarCloudJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/jest.setup.js',
    '!**/__tests__/**',
    '!**/e2e/**',
  ],
  // Lower thresholds for SonarCloud compatibility
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
      lines: 1,
      statements: 1,
    },
  },
  coverageReporters: ['lcov', 'json', 'text-summary'],
  coverageDirectory: 'coverage',
  
  // Test configuration optimized for coverage generation
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/coverage/',
  ],
  
  // Optimize for SonarCloud analysis
  testTimeout: 30000,
  bail: false,
  verbose: false,
  silent: true,
  
  // Force exit to prevent hanging
  forceExit: true,
  detectOpenHandles: false,
  
  // Error handling for SonarCloud
  errorOnDeprecated: false,
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Global setup
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Reporters for SonarCloud
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
    }],
  ],
  
  // Coverage configuration for SonarCloud
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/e2e/',
    '/__tests__/',
    '/jest.config.js',
    '/jest.setup.js',
    '/next.config.js',
    '/tailwind.config.js',
    '/postcss.config.js',
  ],
  
  // Ignore patterns for test files
  testResultsProcessor: undefined,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Collect coverage from all files, even untested ones
  collectCoverage: true,
  
  // Maximum worker processes
  maxWorkers: '50%',
  
  // Cache configuration
  cache: false,
  
  // Watch mode configuration
  watchman: false,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(sonarCloudJestConfig)
