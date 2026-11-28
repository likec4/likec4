import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, it, vi } from 'vitest'
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

  it('returns the root project for the workspace folder with project config', async ({ expect }) => {
    const root = mkdtempSync(join(tmpdir(), 'likec4-resolve-root-'))
    try {
      writeFileSync(join(root, 'likec4.config.json'), JSON.stringify({ name: 'root' }))
      mkdirSync(join(root, 'nested'))
      writeFileSync(join(root, 'nested', 'likec4.config.json'), JSON.stringify({ name: 'nested' }))
      // the selection stays limited to the root project, the nested one is not included
      await expect(resolveProjectArg(root, root)).resolves.toBe('root')
      await expect(resolveProjectArg(root, join(root, 'nested'))).resolves.toBe('nested')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  describe('in the workspace folder', () => {
    beforeAll(() => {
      vi.spyOn(process, 'cwd').mockReturnValue(workspace)
    })

    afterAll(() => {
      vi.restoreAllMocks()
    })

    it('takes a bare name of a folder without config as a project id', async ({ expect }) => {
      await expect(resolveProjectArg(workspace, 'no-config')).resolves.toBe('no-config')
    })

    it('fails for a relative path to a folder without config', async ({ expect }) => {
      await expect(resolveProjectArg(workspace, './no-config')).rejects.toThrow(/No LikeC4 project config found/)
    })
  })
})
