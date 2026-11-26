import { defineVitest } from '@likec4/devops/vitest'

export default defineVitest('likec4-spa', {
  resolve: {
    // `likec4/*` resolves to shims (see tsconfig paths), as the `likec4` package is not a dependency
    tsconfigPaths: true,
  },
})
