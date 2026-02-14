import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  cacheDir: './node_modules/.vite',
  test: {
    slowTestThreshold: 1000,
    snapshotFormat: {
      escapeString: false,
    },
    chaiConfig: {
      truncateThreshold: 100,
    },
    exclude: [
      ...configDefaults.exclude,
      '**/*.spec.js',
      '**/*.test.js',
    ],
    projects: [
      'packages/*/vitest.config.ts',
    ],
  },
})
