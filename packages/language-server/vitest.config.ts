import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/core': resolve(__dirname, '../core/src'),
      '@likec4/log': resolve(__dirname, '../log/src'),
      '@likec4/layouts': resolve(__dirname, '../layouts/src'),
      '@likec4/config': resolve(__dirname, '../config/src'),
    },
  },
  test: {
    name: 'language-server',
    testTimeout: 10_000,
    chaiConfig: {
      includeStack: true,
      truncateThreshold: 100,
    },
    maxConcurrency: 10,
    sequence: {
      concurrent: true,
    },
    exclude: [
      '**/node_modules/**',
      'dist/**',
      'build/**',
      'lib/**',
    ],
  },
})
