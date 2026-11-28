import type { NormalizedUri } from '../workspace'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Cancellation, DocumentState, URI } from 'langium'
import { afterEach, beforeEach, describe, it } from 'vitest'
import { createLanguageServices } from '../module'
import { createTestServices } from '../test'
import { type ExternalProject, externalProjectIdOfFolder, localDependencyUri, ProjectFolder } from '../workspace'
import { WithFileSystem } from './LikeC4FileSystem'

const sharedModel = `
specification {
  element component
}
model {
  component api
}
`

describe('documents of external projects (likec4-dep scheme)', () => {
  describe('node file system', () => {
    let root: string

    beforeEach(async () => {
      root = await mkdtemp(join(tmpdir(), 'likec4-dep-test-'))
      await mkdir(join(root, 'workspace', 'app'), { recursive: true })
      await mkdir(join(root, 'shared'), { recursive: true })
      await writeFile(
        join(root, 'workspace', 'app', 'likec4.config.json'),
        JSON.stringify({ name: 'app', dependencies: { shared: '../../shared' } }),
      )
      await writeFile(join(root, 'workspace', 'app', 'model.c4'), `model { }`)
      await writeFile(join(root, 'shared', 'likec4.config.json'), JSON.stringify({ name: 'shared' }))
      await writeFile(join(root, 'shared', 'model.c4'), sharedModel)
    })

    afterEach(async () => {
      await rm(root, { recursive: true, force: true })
    })

    it('loads documents in memory and serves them from memory', async ({ expect }) => {
      const { shared } = createLanguageServices(WithFileSystem())
      const { WorkspaceManager, LangiumDocuments, DocumentBuilder, FileSystemProvider, ExternalProjects } =
        shared.workspace
      try {
        await WorkspaceManager.initializeWorkspace([{
          name: 'test',
          uri: URI.file(join(root, 'workspace')).toString(),
        }])
        await DocumentBuilder.build(LangiumDocuments.all.toArray(), { validation: true })

        const folder = URI.file(join(root, 'shared'))
        const depUri = localDependencyUri(folder, URI.file(join(root, 'shared', 'model.c4')))
        expect(depUri.scheme).toBe('likec4-dep')
        expect(ExternalProjects.all().map(p => [...p.files.keys()])).toEqual([[depUri.toString()]])
        const doc = LangiumDocuments.getDocument(depUri)!
        expect(doc.state).toBe(DocumentState.Validated)
        expect(doc.likec4ProjectId).toBe(externalProjectIdOfFolder(folder))
        // no file:// document of the dependency
        expect(LangiumDocuments.hasDocument(URI.file(join(root, 'shared', 'model.c4')))).toBe(false)

        // changes on disk are not picked up before reload: reads come from memory
        await writeFile(join(root, 'shared', 'model.c4'), 'model { component changed }')
        expect(await FileSystemProvider.readFile(depUri)).toBe(sharedModel)
        expect(FileSystemProvider.readFileSync(depUri)).toBe(sharedModel)
        expect(await FileSystemProvider.exists(depUri)).toBe(true)
        expect(FileSystemProvider.statSync(depUri)).toMatchObject({ isFile: true, isDirectory: false })
        expect(await FileSystemProvider.exists(URI.parse('likec4-dep://local/nowhere/-/model.c4'))).toBe(false)

        // Langium re-reads the document through the file system provider
        await DocumentBuilder.update([depUri], [])
        const reread = LangiumDocuments.getDocument(depUri)!
        expect(reread.textDocument.getText()).toBe(sharedModel)
        expect(shared.workspace.ProjectsLookup.ownerProjectId(reread)).toBe(externalProjectIdOfFolder(folder))

        // content is served to the client
        const content = await shared.lsp.TextDocumentContentProvider!.provideTextDocumentContent(
          { uri: depUri.toString() },
          Cancellation.CancellationToken.None,
        )
        expect(content).toEqual({ text: sharedModel })
        expect(shared.lsp.TextDocumentContentProvider!.schemes).toEqual(['likec4-dep'])
      } finally {
        await shared.workspace.FileSystemWatcher.dispose()
      }
    })
  })

  describe('without file system', () => {
    it('serves documents of registered instances from memory', async ({ expect }) => {
      const t = createTestServices()
      await t.initialize()
      const { ExternalProjects, FileSystemProvider, LangiumDocuments, LangiumDocumentFactory, DocumentBuilder } =
        t.services.shared.workspace
      const folder = 'file:///deps/shared'
      const depUri = localDependencyUri(URI.parse(folder), URI.parse(`${folder}/model.c4`))
      const project = (text: string): ExternalProject => ({
        id: externalProjectIdOfFolder(folder),
        folder: ProjectFolder(folder),
        folderUri: URI.parse(ProjectFolder(folder)),
        configUri: URI.parse(`${ProjectFolder(folder)}likec4.config.json`),
        config: { name: 'shared' },
        includeConfig: { paths: [], maxDepth: 3, fileThreshold: 30 },
        hash: 'test',
        files: new Map([[depUri.toString() as NormalizedUri, text]]),
      })

      expect(await FileSystemProvider.exists(depUri)).toBe(false)
      ExternalProjects.register(project(sharedModel))
      expect(await FileSystemProvider.readFile(depUri)).toBe(sharedModel)
      expect(FileSystemProvider.readFileSync(depUri)).toBe(sharedModel)
      expect(FileSystemProvider.existsSync(depUri)).toBe(true)

      LangiumDocuments.addDocument(LangiumDocumentFactory.fromString(sharedModel, depUri))
      await DocumentBuilder.build(LangiumDocuments.all.toArray(), { validation: true })

      // re-read through the provider on update
      ExternalProjects.register(project('model { component changed }'))
      await DocumentBuilder.update([depUri], [])
      expect(LangiumDocuments.getDocument(depUri)?.textDocument.getText()).toBe('model { component changed }')
      expect(t.services.likec4.FqnIndex.elements(externalProjectIdOfFolder(folder)).map(e => e.id).toArray())
        .toEqual(['changed'])

      ExternalProjects.unregister(externalProjectIdOfFolder(folder))
      await expect(Promise.resolve().then(() => FileSystemProvider.readFile(depUri))).rejects.toThrow()
    })
  })
})
