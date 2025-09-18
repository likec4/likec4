import { test } from 'vitest'
import { $ } from 'zx'

$.nothrow = false

test.concurrent('LikeC4CLI - build should not fail', { timeout: 30000 }, async ({ expect }) => {
  await expect($`likec4 build src/likec4 -o test-results/build`).resolves.toBeTruthy()
})

// see  https://github.com/likec4/likec4/issues/2076
test.concurrent('LikeC4CLI - single file build should not fail', { timeout: 30000 }, async ({ expect }) => {
  await expect($`likec4 build src/likec4 --output-single-file -o test-results/build-single-file`).resolves.toBeTruthy()
})
