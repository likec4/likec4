import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    alias: {
      '@likec4/core': resolve(__dirname, '../core/src'),
      '@likec4/log': resolve(__dirname, '../log/src'),
    },
  },
  test: {
    name: 'generators',
  },
})
