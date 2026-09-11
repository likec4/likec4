// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { defineConfig, devices } from '@playwright/test'
import { isCI } from 'std-env'

const port = process.env['MCP_APP_TEST_PORT'] ?? '5176'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/mcp-render-app.spec.ts'],
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html']] : 'html',

  use: {
    baseURL,
    browserName: 'chromium',
    colorScheme: 'light',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm tsx ./mcp-app-host.mts',
    url: `${baseURL}/case/scoped`,
    timeout: 60_000,
    reuseExistingServer: !isCI,
  },
})
