import { defineConfig, devices } from '@playwright/test'
import { isCI } from 'std-env'

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: 'tests',
  snapshotPathTemplate: '{testDir}/__screenshots__{/projectName}/{testFilePath}/{arg}{ext}',

  // Run all tests in parallel.
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: isCI,

  // Retry on CI only.
  retries: isCI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: isCI ? 1 : '80%',

  // Reporter to use
  reporter: 'html',

  updateSnapshots: 'missing',
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    // baseURL: 'http://127.0.0.1:5173',

    // Collect trace when retrying the failed test.
    trace: 'retain-on-failure'
  },

  expect: {
    toHaveScreenshot: {
      scale: 'device'
    }
  },

  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome HiDPI'] }
    }
  ],
  // Run your local dev server before starting the tests.
  webServer: {
    command: 'yarn likec4 start',
    port: 5173
    // url: 'http://127.0.0.1:5173',
    // reuseExistingServer: !process.env.CI
  }
})
