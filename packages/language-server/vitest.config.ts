import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/core': resolve(__dirname, '../core/src'),
    },
  },
  test: {
    name: 'language-server',
    testTimeout: 10_000,
  },
})
