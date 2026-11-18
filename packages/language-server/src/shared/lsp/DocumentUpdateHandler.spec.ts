import { URI, UriUtils } from 'langium'
import { describe, vi } from 'vitest'
import { FileChangeType } from 'vscode-languageserver'
import { test as it } from '../../test'

describe('LikeC4DocumentUpdateHandler', () => {
  it('removes documents of a deleted directory', async ({ create, expect }) => {
    const { services, addDocument, validateAll } = create()
    const nested = await addDocument(`model { }`, 'nested/a.c4')
    const other = await addDocument(`model { }`, 'b.c4')
    await validateAll()

    const workspace = services.shared.workspace
    const folder = UriUtils.dirname(nested.uri)
    services.shared.lsp.DocumentUpdateHandler.didChangeWatchedFiles({
      changes: [
        // Client sends single event for the deleted directory
        { uri: folder.toString(), type: FileChangeType.Deleted },
        // Not a LikeC4 file, should be ignored
        { uri: UriUtils.joinPath(folder, '..', 'README.md').toString(), type: FileChangeType.Deleted },
      ],
    })

    await vi.waitFor(() => {
      expect(workspace.LangiumDocuments.hasDocument(nested.uri)).toBe(false)
    })
    expect(workspace.LangiumDocuments.hasDocument(other.uri)).toBe(true)
  })

  it('reloads project config after scheduled reloads were cancelled', async ({ create, expect }) => {
    const { services, initialize } = create()
    await initialize()
    const projects = services.shared.workspace.ProjectsManager
    const registerConfigFile = vi.spyOn(projects, 'registerConfigFile').mockRejectedValue(new Error('mocked'))
    const reloadProjects = vi.spyOn(projects, 'reloadProjects').mockResolvedValue()

    const handler = services.shared.lsp.DocumentUpdateHandler
    const config = URI.parse('file:///test/workspace/src/likec4.config.json').toString()
    const deleted = URI.parse('file:///test/workspace/other/likec4.config.json').toString()

    // Wait for subscriptions (registered on next tick)
    await new Promise(resolve => setTimeout(resolve, 0))

    // Schedule reload, then cancel it with a deleted config
    handler.didChangeWatchedFiles({ changes: [{ uri: config, type: FileChangeType.Changed }] })
    handler.didChangeWatchedFiles({ changes: [{ uri: deleted, type: FileChangeType.Deleted }] })
    expect(reloadProjects).toHaveBeenCalledOnce()

    // Next change should not be ignored
    handler.didChangeWatchedFiles({ changes: [{ uri: config, type: FileChangeType.Changed }] })
    await vi.waitFor(() => {
      expect(registerConfigFile).toHaveBeenCalledOnce()
    })
  })

  it('reloads projects when a folder with a project is deleted', async ({ create, expect }) => {
    const { services, initialize } = create({ projectConfig: { name: 'test-project' } })
    await initialize()
    const projects = services.shared.workspace.ProjectsManager
    const reloadProjects = vi.spyOn(projects, 'reloadProjects').mockResolvedValue()
    const handler = services.shared.lsp.DocumentUpdateHandler

    // Wait for subscriptions (registered on next tick)
    await new Promise(resolve => setTimeout(resolve, 0))

    // Folder inside the project (or a file) does not remove the project
    handler.didChangeWatchedFiles({
      changes: [
        { uri: 'file:///test/workspace/src/nested', type: FileChangeType.Deleted },
        { uri: 'file:///test/workspace/src/model.c4', type: FileChangeType.Deleted },
      ],
    })
    expect(reloadProjects).not.toHaveBeenCalled()

    handler.didChangeWatchedFiles({
      changes: [{ uri: 'file:///test/workspace', type: FileChangeType.Deleted }],
    })
    expect(reloadProjects).toHaveBeenCalledOnce()
  })
})
