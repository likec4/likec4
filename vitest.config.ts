import { defineConfig } from 'vitest/config'

export default defineConfig({
  cacheDir: './node_modules/.vite',
  test: {
    slowTestThreshold: 1000,
    chaiConfig: {
      truncateThreshold: 100,
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.js',
      '**/*.test.js',
    ],
    projects: [
      'packages/*/vitest.config.ts',
    ],
  },
})
