import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/core/compute-view/relationships': resolve(__dirname, '../core/src/compute-view/relationships-view'),
      '@likec4/core': resolve(__dirname, '../core/src'),
    },
  },
  test: {
    name: 'diagram',
  },
})
