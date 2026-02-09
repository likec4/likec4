import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/core': resolve(__dirname, '../core/src'),
      '@likec4/config': resolve(__dirname, '../config/src'),
      '@likec4/style-preset/defaults': resolve(__dirname, '../../styled-system/preset/src/defaults/index.ts'),
    },
  },
  test: {
    name: 'federation',
    chaiConfig: {
      truncateThreshold: 300,
    },
  },
})
