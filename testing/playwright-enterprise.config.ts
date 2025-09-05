/**
 * Enterprise Playwright Configuration for AssetTrackerPro
 * Comprehensive E2E testing for government, enterprise, and educational institutions
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Test directory structure
  testDir: './testing/e2e',

  // Global test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // More retries for enterprise stability
  workers: process.env.CI ? 2 : 4,

  // Reporting configuration
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['line'],
    ['allure-playwright', { outputFolder: 'test-results/allure-results' }],
  ],

  // Global test settings
  use: {
    // Base URL for testing
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Browser settings
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Enterprise security settings
    ignoreHTTPSErrors: false,
    acceptDownloads: true,

    // Timeouts
    actionTimeout: 30000,
    navigationTimeout: 60000,

    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // Extra HTTP headers
    extraHTTPHeaders: {
      'X-Test-Environment': 'enterprise',
      'X-Compliance-Mode': 'strict',
    },
  },

  // Test execution timeout
  timeout: 120000, // 2 minutes for complex enterprise workflows

  // Global setup and teardown
  globalSetup: './testing/setup/global-setup.ts',
  globalTeardown: './testing/setup/global-teardown.ts',

  // Test projects for different environments and browsers
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },

    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.ts/,
    },

    // Desktop browsers - Enterprise environments
    {
      name: 'chromium-enterprise',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--enable-logging',
            '--log-level=0',
          ],
        },
      },
      dependencies: ['setup'],
      testMatch: /.*\.(test|spec)\.ts/,
      testIgnore: /.*\.(mobile|tablet)\.spec\.ts/,
    },

    {
      name: 'firefox-enterprise',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'security.tls.insecure_fallback_hosts': 'localhost',
            'network.stricttransportsecurity.preloadlist': false,
          },
        },
      },
      dependencies: ['setup'],
      testMatch: /.*\.(test|spec)\.ts/,
      testIgnore: /.*\.(mobile|tablet)\.spec\.ts/,
    },

    {
      name: 'webkit-enterprise',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
      testMatch: /.*\.(test|spec)\.ts/,
      testIgnore: /.*\.(mobile|tablet)\.spec\.ts/,
    },

    // Mobile devices - For mobile companion app testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
      testMatch: /.*\.mobile\.(test|spec)\.ts/,
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
      testMatch: /.*\.mobile\.(test|spec)\.ts/,
    },

    // Tablet devices - For hybrid workflows
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
      dependencies: ['setup'],
      testMatch: /.*\.tablet\.(test|spec)\.ts/,
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*\.accessibility\.(test|spec)\.ts/,
    },

    // Performance testing
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-precise-memory-info'],
        },
      },
      dependencies: ['setup'],
      testMatch: /.*\.performance\.(test|spec)\.ts/,
    },

    // Security testing
    {
      name: 'security',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*\.security\.(test|spec)\.ts/,
    },

    // Compliance testing
    {
      name: 'compliance',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*\.compliance\.(test|spec)\.ts/,
    },

    // Cross-browser compatibility
    {
      name: 'compatibility',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*\.compatibility\.(test|spec)\.ts/,
    },
  ],

  // Web server configuration
  webServer: [
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        NODE_ENV: 'test',
        ENTERPRISE_MODE: 'true',
        COMPLIANCE_MODE: 'strict',
      },
    },
    // Mock external services for testing
    {
      command: 'pnpm start:mock-services',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],

  // Test output directories
  outputDir: 'test-results/playwright-artifacts',

  // Expect configuration
  expect: {
    // Timeout for expect assertions
    timeout: 10000,

    // Screenshot comparison threshold
    threshold: 0.2,

    // Animation handling
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
    },

    // Page screenshot options
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
    },
  },

  // Metadata for test reporting
  metadata: {
    testType: 'enterprise-e2e',
    environment: process.env.NODE_ENV || 'test',
    version: process.env.npm_package_version || '1.0.0',
    compliance: ['GDPR', 'SOC2', 'FERPA'],
    security: ['RBAC', 'MFA', 'Encryption'],
    browsers: ['Chrome', 'Firefox', 'Safari'],
    devices: ['Desktop', 'Mobile', 'Tablet'],
  },
})
