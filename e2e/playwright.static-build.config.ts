// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { defineConfig, devices } from '@playwright/test'
import { isCI } from 'std-env'

export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/static-build-relationship-popover.spec.ts'],
  forbidOnly: isCI,
  timeout: 20 * 1000,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['list'], ['html']] : 'html',

  use: {
    baseURL: 'http://127.0.0.1:5175',
    browserName: 'chromium',
    colorScheme: 'light',
    trace: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome HiDPI'] },
    },
  ],

  webServer: {
    command:
      'OUT=$(mktemp -d /tmp/likec4-static-build-XXXXXX) && pnpm likec4 build -o "$OUT" ./src && node ./serve-static-build.mjs "$OUT" 5175',
    url: 'http://127.0.0.1:5175',
    stdout: 'pipe',
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'production',
    },
  },
})
