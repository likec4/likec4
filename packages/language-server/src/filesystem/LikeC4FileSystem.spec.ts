import { URI } from 'langium'
import fs from 'node:fs'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { createLanguageServices } from '../module'
import { WithFileSystem } from './LikeC4FileSystem'

describe('workspace filesystem exclusions', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'likec4-scan-test-'))
    for (const dir of ['model', 'excluded/deep', 'node_modules/deep']) {
      await mkdir(join(root, dir), { recursive: true })
      await writeFile(join(root, dir, 'model.c4'), 'specification { element component }')
      await writeFile(join(root, dir, 'likec4.config.json'), '{"name":"fixture"}')
    }
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(root, { recursive: true, force: true })
  })

  function setup(patterns: string[]) {
    const { shared } = createLanguageServices(WithFileSystem())
    shared.workspace.ProjectsManager.setWorkspaceExcludePatterns(patterns)
    return shared.workspace
  }

  for (const operation of ['readDirectory', 'scanProjectFiles', 'scanDirectory'] as const) {
    it(`${operation} prunes excluded directories before reading them`, async ({ expect }) => {
      const { FileSystemProvider: provider } = setup(['**/excluded/**'])
      const readdir = vi.spyOn(fs, 'readdir')
      const files = operation === 'scanDirectory'
        ? await provider.scanDirectory(URI.file(root), () => true)
        : await provider[operation](URI.file(root))

      expect(files.map(file => relative(root, file.uri.fsPath).replaceAll('\\', '/')).sort()).toEqual(
        operation === 'readDirectory' ?
          ['model/model.c4']
          : operation === 'scanProjectFiles' ?
          ['model/likec4.config.json']
          : ['model/likec4.config.json', 'model/model.c4'],
      )
      // Checking results alone would also pass with filtering after traversal.
      const visited = readdir.mock.calls.map(([path]) => String(path))
      expect(visited.some(path => path.includes('model'))).toBe(true)
      expect(visited.some(path => path.includes('excluded'))).toBe(false)
      expect(visited.some(path => path.includes('node_modules'))).toBe(false)
    })
  }

  it('does not traverse an explicitly excluded scan root', async ({ expect }) => {
    const { FileSystemProvider: provider } = setup(['**/excluded/**'])
    const readdir = vi.spyOn(fs, 'readdir')
    const excluded = URI.file(join(root, 'excluded'))
    expect(await provider.readDirectory(excluded)).toEqual([])
    expect(await provider.scanProjectFiles(excluded)).toEqual([])
    expect(await provider.scanDirectory(excluded, () => true)).toEqual([])
    expect(readdir).not.toHaveBeenCalled()
  })

  it('filters individual files and uses updated exclusions on the next scan', async ({ expect }) => {
    const { FileSystemProvider: provider, ProjectsManager: projects } = setup(['**/excluded/**', '**/model.c4'])
    expect(await provider.readDirectory(URI.file(root))).toEqual([])
    projects.setWorkspaceExcludePatterns(['**/excluded/**', '**/likec4.config.json'])
    expect(await provider.scanProjectFiles(URI.file(root))).toEqual([])
    expect((await provider.readDirectory(URI.file(root))).map(file => file.uri.fsPath))
      .toEqual([join(root, 'model/model.c4')])
  })

  it('prunes an excluded directory symlink while retaining supported symlink discovery', async ({ expect }) => {
    const target = await mkdtemp(join(tmpdir(), 'likec4-link-test-'))
    try {
      await writeFile(join(target, 'linked.c4'), 'model {}')
      await symlink(target, join(root, 'ignored-link'), 'junction')
      await symlink(target, join(root, 'allowed-link'), 'junction')
      const { FileSystemProvider: provider } = setup(['**/excluded/**', '**/ignored-link/**'])
      const files = await provider.readDirectory(URI.file(root))
      expect(files.some(file => file.uri.fsPath.includes('ignored-link'))).toBe(false)
      expect(files.some(file => file.uri.fsPath.includes('allowed-link'))).toBe(true)
    } finally {
      await rm(target, { recursive: true, force: true })
    }
  })
})
