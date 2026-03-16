import { defineVitest } from '@likec4/devops/vitest'

export default defineVitest('language-server', {
  test: {
    testTimeout: 10_000,
    chaiConfig: {
      includeStack: true,
      truncateThreshold: 100,
    },
    maxConcurrency: 10,
    sequence: {
      concurrent: true,
    },
    exclude: [
      '**/node_modules/**',
      'dist/**',
      'build/**',
      'lib/**',
    ],
  },
})
