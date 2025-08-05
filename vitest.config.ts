import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    slowTestThreshold: 1000,
    projects: [
      'packages/*/vitest.config.ts',
    ],
  },
})
