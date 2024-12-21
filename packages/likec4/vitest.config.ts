import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['development'],
  },
  test: {
    name: 'likec4',
    chaiConfig: {
      truncateThreshold: 300,
    },
    setupFiles: [
      'test/setup.ts',
    ],
  },
})
