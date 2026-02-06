import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/style-preset/defaults': resolve(__dirname, '../../styled-system/preset/src/defaults/index.ts'),
    },
  },
  test: {
    name: 'core',
    chaiConfig: {
      truncateThreshold: 300,
    },
    typecheck: {
      only: true,
    },
  },
})
