import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources', 'node'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/style-preset/defaults': resolve(__dirname, '../../styled-system/preset/src/defaults/index.ts'),
      '@likec4/core': resolve(__dirname, '../core/src'),
      '@likec4/log': resolve(__dirname, '../log/src'),
      '@likec4/layouts': resolve(__dirname, '../layouts/src'),
      '@likec4/config': resolve(__dirname, '../config/src'),
      '@likec4/language-server': resolve(__dirname, '../language-server/src'),
      '@likec4/language-services': resolve(__dirname, '../language-services/src'),
      '@likec4/generators': resolve(__dirname, '../generators/src'),
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
