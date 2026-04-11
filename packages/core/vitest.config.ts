import { defineVitest } from '@likec4/devops/vitest'

export default defineVitest('core', {
  test: {
    // Required for *.perf.spec.ts heap-allocation tests that call global.gc()
    execArgv: ['--expose-gc'],
  },
})
