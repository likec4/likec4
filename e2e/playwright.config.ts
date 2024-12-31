import { defineConfig, devices } from '@playwright/test'
import { isCI } from 'std-env'

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: 'tests',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}-{platform}/{arg}{ext}',

  // Run all tests in parallel.
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: isCI,

  // Retry on CI only.
  retries: isCI ? 1 : 0,
  timeout: 10 * 1000,

  // Opt out of parallel tests on CI.
  // workers: isCI ? /1 : '80%',
  workers: isCI ? '75%' : '100%',

  // Reporter to use
  reporter: isCI
    ? [
      ['github'],
      ['list'],
      ['html'],
    ]
    : 'html',

  updateSnapshots: 'missing',
  use: {
    browserName: 'chromium',
    colorScheme: 'light',
    trace: 'retain-on-first-failure',
  },

  expect: {
    toHaveScreenshot: {
      scale: 'device',
      maxDiffPixelRatio: 0.1,
    },
  },

  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome HiDPI'] },
    },
  ],
  // Run your local dev server before starting the tests.
  webServer: {
    command: 'yarn likec4 start',
    port: 5173,
    stdout: 'pipe',
    timeout: 10 * 1000,
    // url: 'http://127.0.0.1:5173',
    // reuseExistingServer: !process.env.CI
  },
})
