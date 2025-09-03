import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/core': resolve(__dirname, '../core/src'),
      '@likec4/log': resolve(__dirname, '../log/src'),
    },
  },
  test: {
    name: 'config',
    chaiConfig: {
      truncateThreshold: 300,
    },
  },
})
