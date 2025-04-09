import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    alias: {
      '@likec4/core': resolve(__dirname, '../core/src'),
      '@likec4/language-server': resolve(__dirname, '../language-server/src'),
      '@likec4/layouts': resolve(__dirname, '../layouts/src'),
      '@likec4/generators': resolve(__dirname, '../generators/src'),
    },
  },
  test: {
    name: 'likec4',
    chaiConfig: {
      truncateThreshold: 300,
    },
  },
})
