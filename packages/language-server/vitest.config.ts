import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    conditions: ['sources'],
  },
  test: {
    name: 'language-server',
    testTimeout: 10_000,
  },
})
