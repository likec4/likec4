import { defineConfig } from 'vitest/config'

export default defineConfig({
  cacheDir: './node_modules/.vite',
  test: {
    slowTestThreshold: 1000,
    chaiConfig: {
      truncateThreshold: 300,
    },
    projects: [
      'packages/*/vitest.config.ts',
    ],
  },
})
