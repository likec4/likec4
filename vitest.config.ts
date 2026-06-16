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
      truncateThreshold: 200,
    },
    maxWorkers: '90%',
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
