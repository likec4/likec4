import { defineConfig, devices } from '@playwright/test'
import { isCI } from 'std-env'

/**
 * Playwright config for Playground app E2E (e.g. DrawIO context menu).
 * Run: pnpm exec playwright test -c playwright.playground.config.ts
 * Requires the playground to be built or will start it via webServer.
 */
export default defineConfig({
  testDir: 'tests',
  testMatch: '**/drawio-playground.spec.ts',

  forbidOnly: isCI,
  timeout: 60 * 1000,
  retries: isCI ? 1 : 0,

  use: {
    browserName: 'chromium',
    colorScheme: 'light',
    trace: 'on',
    baseURL: 'http://localhost:5174',
  },

  projects: [
    {
      name: 'playground',
      use: { ...devices['Desktop Chrome HiDPI'] },
    },
  ],

  webServer: {
    command: 'pnpm --filter @likec4/playground dev -- --port 5174',
    port: 5174,
    stdout: 'pipe',
    reuseExistingServer: !isCI,
  },
})
