import { test } from 'vitest'
import { $ } from 'zx'

$.nothrow = false

const sourceDir = 'src/likec4'
const outDir = 'test-results/build'
const outDirSingleFile = 'test-results/build-single-file'

test.concurrent('LikeC4CLI - build should not fail', { timeout: 30000 }, async ({ expect }) => {
  await expect($`likec4 build ${sourceDir} -o ${outDir}`).resolves.toBeTruthy()
})

// see https://github.com/likec4/likec4/issues/2076
test.concurrent('LikeC4CLI - single file build should not fail', { timeout: 30000 }, async ({ expect }) => {
  await expect($`likec4 build ${sourceDir} --output-single-file -o ${outDirSingleFile}`).resolves.toBeTruthy()
})
