// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { defineConfig, devices } from '@playwright/test'

/**
 * Minimal Playwright config for capturing AI Chat documentation screenshots.
 *
 * Usage:
 *   cd e2e && npx playwright test capture-ai-chat-screenshots.ts --config playwright.screenshot.config.ts
 *
 * The webServer block below starts the app automatically if not already running.
 */
export default defineConfig({
  testDir: '.',
  testMatch: ['capture-ai-chat-screenshots.ts'],
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    colorScheme: 'light',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'screenshots',
      use: { ...devices['Desktop Chrome HiDPI'] },
    },
  ],
  webServer: {
    command: 'pnpm likec4 start --no-react-hmr --no-build-webcomponent',
    port: 5173,
    reuseExistingServer: true,
    stdout: 'pipe',
    env: {
      NODE_ENV: 'production',
    },
  },
})
