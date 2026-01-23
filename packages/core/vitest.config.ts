import { resolve } from 'node:path'
import { defineProject } from 'vitest/config'

const isNotWin = process.platform !== 'win32'

export default defineProject({
  resolve: {
    conditions: ['sources'],
    // Seems vitest doesn't resolve conditions
    alias: {
      '@likec4/style-preset': resolve(__dirname, '../../styled-system/preset/src'),
    },
  },
  test: {
    name: 'core',
    chaiConfig: {
      truncateThreshold: 300,
    },
    typecheck: {
      enabled: isNotWin, // skipping typecheck on windows
    },
  },
})
