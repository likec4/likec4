import { defineVitest } from '@likec4/devops/vitest'

export default defineVitest('language-services', {
  test: {
    testTimeout: 30_000,
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
