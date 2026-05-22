import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  ssr: {
    resolve: {
      conditions: ['sources'],
    },
  },
  test: {
    slowTestThreshold: 1000,
    snapshotFormat: {
      escapeString: false,
    },
    chaiConfig: {
      truncateThreshold: 100,
    },
    maxWorkers: '90%',
    maxConcurrency: 8,
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
