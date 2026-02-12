import { defineConfig, devices } from '@playwright/test'
import { isCI } from 'std-env'

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: 'tests',
  // DrawIO playground test runs only with playwright.playground.config.ts (playground on 5174)
  testIgnore: '**/drawio-playground.spec.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}-{platform}/{arg}{ext}',

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: isCI,

  // Timeout for each test
  timeout: 15 * 1000,

  maxFailures: 5,

  // Retry on CI only.
  retries: isCI ? 1 : 0,

  // Opt out of parallel tests on CI.
  // workers: isCI ? /1 : '80%',
  // workers: isCI ? '75%' : '100%',

  // Reporter to use
  reporter: isCI
    ? [
      ['github'],
      ['list'],
      ['html'],
    ]
    : 'html',

  use: {
    browserName: 'chromium',
    colorScheme: 'light',
    trace: 'on',
  },

  expect: {
    toHaveScreenshot: {
      scale: 'device',
      animations: 'disabled',
      // Allow small pixel diff (e.g. fonts/layout flakiness on CI)
      maxDiffPixelRatio: 0.02,
    },
  },

  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome HiDPI'] },
    },
  ],

  webServer: {
    command: 'pnpm likec4 start --verbose --no-react-hmr --no-build-webcomponent',
    port: 5173,
    stdout: 'pipe',
    env: {
      NODE_ENV: 'production',
    },
  },
  // To run locally
  // webServer: {
  //   command: 'pnpm dev:e2e',
  //   cwd: '../packages/likec4/',
  //   port: 5173,
  //   stdout: 'pipe',
  //   env: {
  //     NODE_ENV: 'development',
  //   },
  // },
})
