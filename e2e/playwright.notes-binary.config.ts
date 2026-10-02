// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { defineConfig, devices } from '@playwright/test'
import { isCI } from 'std-env'

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/note-cards-export.spec.ts',
  forbidOnly: isCI,
  timeout: 20 * 1000,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['list'], ['html']] : 'html',

  use: {
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
    command: 'pnpm exec likec4 build --use-dot -o ./dist ./src && pnpm exec likec4 preview',
    port: 62001,
    stdout: 'pipe',
    timeout: 60 * 1000,
    env: {
      NODE_ENV: 'production',
    },
  },
})
