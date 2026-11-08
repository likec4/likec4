import { test } from 'vitest'
import { $ } from 'zx'

$.nothrow = false

// A workspace with several projects; the only diff (rfc1) is in src/model-diffs
const sourceDir = 'src'

test.concurrent('LikeC4CLI - diff list covers all projects and prints clean JSON', { timeout: 60000 }, async ({
  expect,
}) => {
  const { stdout } = await $`likec4 diff list ${sourceDir} --json`
  expect(JSON.parse(stdout)).toEqual([expect.objectContaining({ projectId: 'model-diffs', id: 'rfc1' })])
})

test.concurrent('LikeC4CLI - diff apply finds the project of the diff', { timeout: 60000 }, async ({ expect }) => {
  const { stdout } = await $`likec4 diff apply rfc1 --dry-run ${sourceDir}`
  expect(stdout).toContain('Apply diff rfc1 (dry run)')
})

test.concurrent('LikeC4CLI - safe-delete reports an unknown element', { timeout: 60000 }, async ({ expect }) => {
  const result = await $({ nothrow: true })`likec4 safe-delete nowhere.element --dry-run ${sourceDir}`
  expect(result.exitCode).toBe(1)
  expect(result.stdout + result.stderr).toContain('Element nowhere.element not found')
})
