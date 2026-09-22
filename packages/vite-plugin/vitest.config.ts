import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources', 'node'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/style-preset/defaults': resolve(import.meta.dirname, '../../styled-system/preset/src/defaults/index.ts'),
      '@likec4/core': resolve(import.meta.dirname, '../core/src'),
      '@likec4/log': resolve(import.meta.dirname, '../log/src'),
      '@likec4/layouts': resolve(import.meta.dirname, '../layouts/src'),
      '@likec4/config': resolve(import.meta.dirname, '../config/src'),
      '@likec4/language-server': resolve(import.meta.dirname, '../language-server/src'),
      '@likec4/language-services': resolve(import.meta.dirname, '../language-services/src'),
      '@likec4/generators': resolve(import.meta.dirname, '../generators/src'),
    },
  },
  test: {
    name: 'vite-plugin',
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
