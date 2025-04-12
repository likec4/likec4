import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    alias: {
      '@likec4/core': resolve(__dirname, '../core/src'),
    },
  },
  test: {
    name: 'diagram',
  },
})
