import { URI } from 'langium'
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { createLanguageServices } from '../module'
import { WithFileSystem } from './LikeC4FileSystem'
import { WithLikeC4ManualLayouts } from './LikeC4ManualLayouts'

describe('ChokidarFileSystemWatcher', () => {
  let root: string
  let services: ReturnType<typeof createLanguageServices>

  beforeEach(async () => {
    // realpath: on macOS tmpdir is a symlink, and chokidar reports resolved paths
    root = await realpath(await mkdtemp(join(tmpdir(), 'likec4-watcher-test-')))
    await mkdir(join(root, 'nested'), { recursive: true })
    await writeFile(join(root, 'likec4.config.json'), '{"name":"watched"}')
    await writeFile(join(root, 'nested', 'a.c4'), 'model { }')
    services = createLanguageServices({
      ...WithFileSystem(true),
      ...WithLikeC4ManualLayouts,
    })
    await services.shared.workspace.WorkspaceManager.initializeWorkspace([
      { name: 'test', uri: URI.file(root).toString() },
    ])
  })

  afterEach(async () => {
    await services.likec4.likec4.LanguageServices.dispose()
    await rm(root, { recursive: true, force: true })
  })

  it('passes file changes through the DocumentUpdateHandler', async ({ expect }) => {
    const { workspace, lsp } = services.shared
    const nested = URI.file(join(root, 'nested', 'a.c4'))
    await vi.waitFor(() => {
      expect(workspace.LangiumDocuments.hasDocument(nested)).toBe(true)
    })
    const onWatchedFilesChange = vi.fn()
    lsp.DocumentUpdateHandler.onWatchedFilesChange(onWatchedFilesChange)
    const onManualLayoutUpdate = vi.fn()
    workspace.ManualLayouts.onManualLayoutUpdate(onManualLayoutUpdate)

    // New LikeC4 file
    // (written until it is picked up: chokidar may be not ready yet, and miss the first event)
    const created = URI.file(join(root, 'b.c4'))
    await vi.waitFor(async () => {
      await writeFile(created.fsPath, 'model { }')
      expect(workspace.LangiumDocuments.hasDocument(created)).toBe(true)
    }, { timeout: 10000, interval: 300 })

    // Snapshot file
    await mkdir(join(root, '.likec4'), { recursive: true })
    await writeFile(join(root, '.likec4', 'index.likec4.snap'), '{}')
    await vi.waitFor(() => {
      expect(onManualLayoutUpdate).toHaveBeenCalled()
    }, { timeout: 5000 })

    // Deleted folder
    await rm(join(root, 'nested'), { recursive: true, force: true })
    await vi.waitFor(() => {
      expect(workspace.LangiumDocuments.hasDocument(nested)).toBe(false)
    }, { timeout: 5000 })

    expect(onWatchedFilesChange).toHaveBeenCalled()
  })
})
