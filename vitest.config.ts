import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['sources', 'development'],
  },
  test: {
    workspace: ['packages/*'],
    testTimeout: 10_000,
    slowTestThreshold: 1_000,
  },
})
