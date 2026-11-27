import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { resolveProjectArg } from './utils'

describe('resolveProjectArg', () => {
  let workspace: string

  beforeAll(() => {
    workspace = mkdtempSync(join(tmpdir(), 'likec4-resolve-project-'))
    mkdirSync(join(workspace, 'alpha-folder'))
    writeFileSync(join(workspace, 'alpha-folder', 'likec4.config.json'), JSON.stringify({ name: 'alpha' }))
    mkdirSync(join(workspace, 'no-config'))
  })

  afterAll(() => {
    rmSync(workspace, { recursive: true, force: true })
  })

  it('returns undefined without project', async ({ expect }) => {
    await expect(resolveProjectArg(workspace, undefined)).resolves.toBeUndefined()
  })

  it('returns undefined for the workspace folder itself', async ({ expect }) => {
    await expect(resolveProjectArg(workspace, workspace)).resolves.toBeUndefined()
  })

  it('returns the project id as is', async ({ expect }) => {
    await expect(resolveProjectArg(workspace, 'alpha')).resolves.toBe('alpha')
  })

  it('returns the name from the config of the project folder', async ({ expect }) => {
    await expect(resolveProjectArg(workspace, join(workspace, 'alpha-folder'))).resolves.toBe('alpha')
  })

  it('fails for a folder without project config', async ({ expect }) => {
    await expect(resolveProjectArg(workspace, join(workspace, 'no-config'))).rejects.toThrow(
      /No LikeC4 project config found/,
    )
  })
})
