import { isLikeC4Config, LikeC4ProjectConfigOps, parseGitRepositoryUrl } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import { configureLogger } from '@likec4/log'
import JSON5 from 'json5'
import { type LangiumDocument, Cancellation, DocumentState, URI, UriUtils } from 'langium'
import { addDiagnosticsHandler } from 'langium/lsp'
import { describe } from 'vitest'
import type { Connection, WorkspaceFolder } from 'vscode-languageserver'
import type { DependencyInstaller } from '../dependencies/types'
import type { FileNode } from '../filesystem'
import { DependencyFileSystem } from '../filesystem/DependencyFileSystem'
import { LikeC4TextDocumentContentProvider } from '../lsp/TextDocumentContentProvider'
import { DefaultLikeC4ModelBuilder } from '../model/model-builder'
import { mockMethod, test as it } from '../test'
import type { createTestServices } from '../test/testServices'
import { type GitDependencyInstance, gitDependencyUri, localDependencyUri } from './dependency-uri'
import { withoutUserInfo } from './DependencyResolver'
import { type ExternalProject, externalProjectIdOfFolder, externalProjectIdOfGitInstance } from './ExternalProjects'
import { type NormalizedUri, ProjectFolder } from './ProjectsManager'

type TestServices = ReturnType<typeof createTestServices>

const norm = (uri: string | URI) => (URI.isUri(uri) ? uri : URI.parse(uri)).toString()

const fileNode = (uri: URI): FileNode => ({
  isFile: true,
  isDirectory: false,
  uri,
})

/**
 * In-memory file system, mocks methods of the FileSystemProvider of the test services
 */
function mockFileSystem(t: TestServices, initial: Record<string, string>) {
  const files = new Map<string, string>()
  const write = (entries: Record<string, string>) => {
    for (const [uri, content] of Object.entries(entries)) {
      files.set(norm(uri), content)
    }
  }
  const remove = (uri: string) => files.delete(norm(uri))
  write(initial)

  const under = (folder: URI) => {
    const prefix = norm(folder).replace(/\/?$/, '/')
    return [...files.keys()].filter(uri => uri.startsWith(prefix)).map(uri => URI.parse(uri))
  }

  const fs = t.services.shared.workspace.FileSystemProvider
  mockMethod(fs, 'exists').mockImplementation(async uri => files.has(norm(uri)) || under(uri).length > 0)
  mockMethod(fs, 'scanProjectFiles').mockImplementation(async folder =>
    under(folder).filter(uri => isLikeC4Config(UriUtils.basename(uri))).map(fileNode)
  )
  mockMethod(fs, 'readDirectory').mockImplementation(async folder =>
    under(folder).filter(uri => /\.(c4|likec4)$/.test(uri.path)).map(fileNode)
  )
  const readFile = mockMethod(fs, 'readFile').mockImplementation(async uri => files.get(norm(uri)) ?? '')
  const loadProjectConfig = mockMethod(fs, 'loadProjectConfig').mockImplementation(async uri => {
    const content = files.get(norm(uri))
    if (content === undefined) {
      throw new Error(`not found ${uri}`)
    }
    if (!uri.path.endsWith('.json') && !uri.path.endsWith('rc')) {
      throw new Error(`executable config must not be loaded: ${uri}`)
    }
    return LikeC4ProjectConfigOps.validate({
      name: UriUtils.basename(UriUtils.dirname(uri)),
      ...JSON5.parse(content),
    })
  })
  return { write, remove, loadProjectConfig, readFile }
}

async function startWorkspace(t: TestServices, workspace: string) {
  const workspaceFolder: WorkspaceFolder = {
    name: 'workspace',
    uri: workspace,
  }
  const { WorkspaceManager } = t.services.shared.workspace
  WorkspaceManager.initialize({
    capabilities: {},
    processId: null,
    rootUri: workspaceFolder.uri,
    workspaceFolders: [workspaceFolder],
  })
  await WorkspaceManager.initializeWorkspace([workspaceFolder])
  await buildAll(t)
}

async function ProjectsManager_reload(t: TestServices) {
  await t.services.shared.workspace.ProjectsManager.reloadProjects()
  await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()
}

async function buildAll(t: TestServices) {
  const { DocumentBuilder, LangiumDocuments } = t.services.shared.workspace
  await DocumentBuilder.build(LangiumDocuments.all.toArray(), { validation: true })
}

const config = (value: object) => JSON.stringify(value)

const sharedModel = `
specification {
  element component
}
model {
  component api
  component db
  api -> db
}
`

describe('ExternalProjects', () => {
  it('loads a dependency outside of the workspace on startup', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/shared/likec4.config.json': config({ name: 'shared-lib' }),
      'file:///test/shared/model.c4': sharedModel,
      'file:///test/shared/nested/more.likec4': 'model { component more }',
    })
    await startWorkspace(t, 'file:///test/workspace')

    const { ExternalProjects, ProjectsLookup, ProjectsManager, LangiumDocuments } = t.services.shared.workspace
    const id = externalProjectIdOfFolder('file:///test/shared')
    expect(id).toBe('#file:///test/shared')

    const instances = ExternalProjects.all()
    expect(instances).toHaveLength(1)
    const instance = instances[0]!
    expect(instance.id).toBe(id)
    expect(instance.config.name).toBe('shared-lib')
    expect(instance.folder).toBe('file:///test/shared/')
    expect(ExternalProjects.findByFolder('file:///test/shared')).toBe(instance)
    expect(ExternalProjects.documents(id).map(String).sort()).toEqual([
      'likec4-dep://local/test/shared/-/model.c4',
      'likec4-dep://local/test/shared/-/nested/more.likec4',
    ])

    // documents are loaded into the workspace and owned by the instance
    const sharedDoc = LangiumDocuments.getDocument(URI.parse('likec4-dep://local/test/shared/-/model.c4'))!
    expect(sharedDoc).toBeDefined()
    expect(sharedDoc.state).toBe(DocumentState.Validated)
    expect(ProjectsLookup.ownerProjectId(sharedDoc)).toBe(id)
    expect(ProjectsLookup.getProject(id)).toBe(instance)
    expect(ProjectsLookup.getProject(sharedDoc)).toBe(instance)
    expect(ProjectsLookup.isIncluded(id, sharedDoc)).toBe(true)
    expect(ProjectsLookup.isIncluded('a' as ProjectId, sharedDoc)).toBe(false)
    expect(ProjectsLookup.isIncluded('default' as ProjectId, sharedDoc)).toBe(false)
    expect(ProjectsLookup.isExcluded('a' as ProjectId, sharedDoc)).toBe(true)
    expect(ProjectsLookup.isExcluded(id, sharedDoc)).toBe(false)

    // elements are in the index under the external id, references are linked
    const elements = t.services.likec4.FqnIndex.elements(id).map(e => e.id).toArray().sort()
    expect(elements).toEqual(['api', 'db', 'more'])
    expect(sharedDoc.references.length).toBeGreaterThan(0)
    expect(sharedDoc.references.filter(ref => ref.error !== undefined)).toEqual([])
    expect(t.services.likec4.FqnIndex.elements('a' as ProjectId).toArray()).toEqual([])

    // not a workspace project
    expect(ProjectsManager.all).not.toContain(id)
    expect(LangiumDocuments.userDocuments.map(d => d.uri.toString()).toArray()).toEqual([
      'file:///test/workspace/a/model.c4',
    ])
    expect(LangiumDocuments.projectDocuments(id).map(d => d.uri.toString()).toArray()).toEqual([
      'likec4-dep://local/test/shared/-/model.c4',
      'likec4-dep://local/test/shared/-/nested/more.likec4',
    ])
  })

  it('offers no previews or refactorings in documents of external projects', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const withView = `
specification {
  element component
}
model {
  api = component 'API'
}
views {
  view index {
    include *
  }
}
`
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': withView,
      'file:///test/shared/likec4.config.json': config({ name: 'shared-lib' }),
      'file:///test/shared/model.c4': withView,
    })
    await startWorkspace(t, 'file:///test/workspace')

    const { LangiumDocuments, ProjectsLookup } = t.services.shared.workspace
    const { CodeLensProvider, CodeActionProvider } = t.services.lsp
    const depDoc = LangiumDocuments.getDocument(URI.parse('likec4-dep://local/test/shared/-/model.c4'))!
    const userDoc = LangiumDocuments.getDocument(URI.parse('file:///test/workspace/a/model.c4'))!
    expect(depDoc).toBeDefined()
    expect(userDoc).toBeDefined()
    expect(ProjectsLookup.isExternalDocument(depDoc)).toBe(true)
    expect(ProjectsLookup.isExternalDocument(userDoc)).toBe(false)

    // no "open preview" / "save png" lenses with internal project ids
    expect(await CodeLensProvider!.provideCodeLens(depDoc, { textDocument: { uri: depDoc.uri.toString() } })).toEqual(
      [],
    )
    const userLenses = await CodeLensProvider!.provideCodeLens(userDoc, {
      textDocument: { uri: userDoc.uri.toString() },
    })
    expect(userLenses?.map(l => l.command?.arguments)).toEqual([['index', 'a'], ['index', 'a']])

    // no refactorings ("Safe delete", "Preview removal impact") on elements of an external project
    const apiOffset = (doc: LangiumDocument) => doc.textDocument.positionAt(doc.textDocument.getText().indexOf('api ='))
    const actionsAt = (doc: LangiumDocument) =>
      CodeActionProvider!.getCodeActions(doc, {
        textDocument: { uri: doc.uri.toString() },
        range: { start: apiOffset(doc), end: apiOffset(doc) },
        context: { diagnostics: [] },
      })
    expect(await actionsAt(depDoc)).toBeUndefined()
    expect(await actionsAt(userDoc)).not.toHaveLength(0)
  })

  it('shares one instance between consumers of the same folder', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/workspace/b/likec4.config.json': config({
        name: 'b',
        dependencies: { lib: '../../workspace/../shared' },
      }),
      'file:///test/workspace/b/model.c4': 'model { }',
      'file:///test/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///test/workspace')

    const { ExternalProjects, LangiumDocuments } = t.services.shared.workspace
    const instances = ExternalProjects.all()
    expect(instances).toHaveLength(1)
    const id = instances[0]!.id
    expect(id).toBe('#file:///test/shared')
    // without config, the folder name is used
    expect(instances[0]!.config.name).toBe('shared')
    expect(ExternalProjects.dependencyTargets().get(id)?.consumers).toEqual(new Set(['a', 'b']))

    const sharedDocs = LangiumDocuments.all
      .filter(d => d.uri.toString().startsWith('likec4-dep://local/test/shared/-/'))
      .toArray()
    expect(sharedDocs).toHaveLength(1)
    expect(t.services.likec4.FqnIndex.elements(id).map(e => e.id).toArray().sort()).toEqual(['api', 'db'])
  })

  it('does not publish diagnostics for documents of an instance', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const broken = `
      model {
        component api
        api -> unknown
        this is not valid syntax
      }
    `
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/broken.c4': broken,
      'file:///test/shared/broken.c4': broken,
    })
    // Same handler as the language server uses to publish diagnostics
    const published = [] as Array<{ uri: string; diagnostics: unknown[] }>
    const connection = {
      sendDiagnostics: async (params: { uri: string; diagnostics: unknown[] }) => {
        published.push(params)
      },
    }
    addDiagnosticsHandler(connection as unknown as Connection, t.services.shared)
    await startWorkspace(t, 'file:///test/workspace')

    // Only an empty list is published for external documents (it clears diagnostics in the editor)
    const publishedExternal = published.filter(p => p.uri.startsWith('likec4-dep://local/test/shared/-/'))
    expect(publishedExternal.length).toBeGreaterThan(0)
    expect(publishedExternal.flatMap(p => p.diagnostics)).toEqual([])
    expect(published.find(p => p.uri === 'file:///test/workspace/a/broken.c4')?.diagnostics.length)
      .toBeGreaterThan(0)

    const { LangiumDocuments } = t.services.shared.workspace
    const doc = (uri: string) => LangiumDocuments.getDocument(URI.parse(uri)) as LangiumDocument
    // Same content in the workspace has errors
    const workspaceDoc = doc('file:///test/workspace/a/broken.c4')
    expect(workspaceDoc.diagnostics?.length).toBeGreaterThan(0)

    const externalDoc = doc('likec4-dep://local/test/shared/-/broken.c4')
    expect(externalDoc.state).toBe(DocumentState.Validated)
    expect(externalDoc.parseResult.parserErrors.length).toBeGreaterThan(0)
    expect(externalDoc.diagnostics).toEqual([])
  })

  it('does not execute an executable config of a dependency', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const { loadProjectConfig } = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/shared/likec4.config.ts': `export default { name: 'from-ts' }`,
      'file:///test/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///test/workspace')

    const loadedConfigs = loadProjectConfig.mock.calls.map(([uri]) => uri.toString())
    expect(loadedConfigs).toEqual(['file:///test/workspace/a/likec4.config.json'])

    const instances = t.services.shared.workspace.ExternalProjects.all()
    expect(instances).toHaveLength(1)
    // default config
    expect(instances[0]!.config.name).toBe('shared')
    expect(instances[0]!.files.size).toBe(1)
  })

  it('ignores include paths of a dependency', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/shared/.likec4rc': config({ name: 'shared-lib', include: { paths: ['../other'] } }),
      'file:///test/shared/model.c4': sharedModel,
      'file:///test/other/other.c4': 'model { component other }',
    })
    await startWorkspace(t, 'file:///test/workspace')

    const { ExternalProjects, LangiumDocuments } = t.services.shared.workspace
    const instance = ExternalProjects.all()[0]!
    expect(instance.config.name).toBe('shared-lib')
    expect(instance.includePaths).toBeUndefined()
    expect(instance.includeConfig.paths).toEqual([])
    expect([...instance.files.keys()]).toEqual(['likec4-dep://local/test/shared/-/model.c4'])
    expect(LangiumDocuments.hasDocument(URI.parse('file:///test/other/other.c4'))).toBe(false)
  })

  it('does not create an instance for a dependency inside the workspace', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { b: '../b', lib: '../lib' },
      }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/workspace/b/likec4.config.json': config({ name: 'b' }),
      'file:///test/workspace/b/model.c4': sharedModel,
      // folder without config, but inside the workspace
      'file:///test/workspace/lib/model.c4': 'model { }',
    })
    await startWorkspace(t, 'file:///test/workspace')

    const { ExternalProjects, ProjectsLookup } = t.services.shared.workspace
    expect(ExternalProjects.all()).toEqual([])
    expect(ExternalProjects.dependencyTargets().size).toBe(0)
    expect(ProjectsLookup.ownerProjectId('file:///test/workspace/b/model.c4')).toBe('b')
  })

  it('does not create an instance for a missing folder', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../missing' } }),
      'file:///test/workspace/a/model.c4': 'model { }',
    })
    await startWorkspace(t, 'file:///test/workspace')
    expect(t.services.shared.workspace.ExternalProjects.all()).toEqual([])
  })

  it('removes an instance and its documents when the dependency is removed on reload', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/shared/model.c4': sharedModel,
      'file:///test/other/model.c4': 'model { component other }',
    })
    await startWorkspace(t, 'file:///test/workspace')

    const { ExternalProjects, LangiumDocuments, ProjectsManager } = t.services.shared.workspace
    const sharedDocUri = URI.parse('likec4-dep://local/test/shared/-/model.c4')
    expect(ExternalProjects.has('#file:///test/shared')).toBe(true)
    expect(LangiumDocuments.hasDocument(sharedDocUri)).toBe(true)

    // switch to another dependency
    fs.write({
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { other: '../../other' } }),
    })
    await ProjectsManager.reloadProjects()
    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()

    expect(ExternalProjects.has('#file:///test/shared')).toBe(false)
    expect(ExternalProjects.ownerOf(sharedDocUri)).toBeUndefined()
    expect(ExternalProjects.readFile(sharedDocUri)).toBeUndefined()
    expect(LangiumDocuments.hasDocument(sharedDocUri)).toBe(false)
    expect(ExternalProjects.all().map(p => p.id)).toEqual(['#file:///test/other'])
    const otherDoc = LangiumDocuments.getDocument(URI.parse('likec4-dep://local/test/other/-/model.c4'))!
    expect(otherDoc.state).toBe(DocumentState.Validated)
    expect(t.services.likec4.FqnIndex.elements('#file:///test/other' as ProjectId).map(e => e.id).toArray())
      .toEqual(['other'])

    // remove the dependencies section
    fs.write({
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a' }),
    })
    await ProjectsManager.reloadProjects()
    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()
    expect(ExternalProjects.all()).toEqual([])
    expect(LangiumDocuments.hasDocument(URI.parse('likec4-dep://local/test/other/-/model.c4'))).toBe(false)
    expect(LangiumDocuments.all.map(d => d.uri.toString()).filter(u => u.startsWith('file:')).toArray()).toEqual([
      'file:///test/workspace/a/model.c4',
    ])
  })

  it('picks up changes in a dependency on reload', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/shared/model.c4': sharedModel,
      'file:///test/shared/removed.c4': 'model { component removed }',
    })
    await startWorkspace(t, 'file:///test/workspace')
    const id = '#file:///test/shared' as ProjectId

    fs.write({
      'file:///test/shared/model.c4': 'model { component changed }',
      'file:///test/shared/added.c4': 'model { component added }',
    })
    fs.remove('file:///test/shared/removed.c4')
    await t.services.shared.workspace.ProjectsManager.reloadProjects()
    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()

    const { ExternalProjects, LangiumDocuments } = t.services.shared.workspace
    expect(ExternalProjects.all()).toHaveLength(1)
    expect(ExternalProjects.documents(id).map(String).sort()).toEqual([
      'likec4-dep://local/test/shared/-/added.c4',
      'likec4-dep://local/test/shared/-/model.c4',
    ])
    expect(LangiumDocuments.hasDocument(URI.parse('likec4-dep://local/test/shared/-/removed.c4'))).toBe(false)
    expect(t.services.likec4.FqnIndex.elements(id).map(e => e.id).toArray().sort()).toEqual(['added', 'changed'])
  })

  it('adds an instance when a dependency is added to a project config', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a' }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { ExternalProjects, LangiumDocuments, ProjectsManager } = t.services.shared.workspace
    expect(ExternalProjects.all()).toEqual([])

    fs.write({
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
    })
    await ProjectsManager.registerConfigFile(URI.parse('file:///test/workspace/a/likec4.config.json'))

    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()
    expect(ExternalProjects.has('#file:///test/shared')).toBe(true)
    const doc = LangiumDocuments.getDocument(URI.parse('likec4-dep://local/test/shared/-/model.c4'))
    expect(doc?.state).toBe(DocumentState.Validated)
    expect(t.services.likec4.FqnIndex.elements('#file:///test/shared' as ProjectId).map(e => e.id).toArray().sort())
      .toEqual(['api', 'db'])
  })

  it('matches Windows paths with drive letters to the right instance', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///C%3A/work/workspace' })
    mockFileSystem(t, {
      'file:///C%3A/work/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { shared: '../../shared', other: '../../shared-other' },
      }),
      'file:///C%3A/work/workspace/b/likec4.config.json': config({
        name: 'b',
        dependencies: { lib: '../../shared' },
      }),
      'file:///c%3A/work/shared/model.c4': sharedModel,
      'file:///C%3A/work/shared-other/model.c4': 'model { component other }',
    })
    await startWorkspace(t, 'file:///C:/work/workspace')

    const { ExternalProjects, ProjectsLookup } = t.services.shared.workspace
    const shared = externalProjectIdOfFolder('file:///C:/work/shared/')
    const other = externalProjectIdOfFolder('file:///c%3A/work/shared-other')
    expect(shared).toBe('#file:///c%3A/work/shared')
    expect(other).toBe('#file:///c%3A/work/shared-other')
    expect(ExternalProjects.all().map(p => p.id).sort()).toEqual([shared, other])

    for (
      const uri of [
        'likec4-dep://local/C:/work/shared/-/model.c4',
        'likec4-dep://local/c:/work/shared/-/model.c4',
        'likec4-dep://local/C%3A/work/shared/-/model.c4',
        localDependencyUri(URI.file('C:/work/shared'), URI.file('C:/work/shared/model.c4')),
      ]
    ) {
      expect(ProjectsLookup.ownerProjectId(uri)).toBe(shared)
    }
    expect(ProjectsLookup.ownerProjectId('likec4-dep://local/C:/work/shared-other/-/model.c4')).toBe(other)
    expect(ExternalProjects.findByFolder('file:///C:/work/shared')?.id).toBe(shared)
    expect(ExternalProjects.findByFolder(URI.parse('file:///c%3A/work/shared-other/'))?.id).toBe(other)
    expect(ProjectsLookup.isIncluded(shared, 'likec4-dep://local/C:/work/shared-other/-/model.c4')).toBe(false)
    expect(t.services.likec4.FqnIndex.elements(shared).map(e => e.id).toArray().sort()).toEqual(['api', 'db'])
  })

  it.runIf(process.platform === 'win32')('matches Windows file system paths', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///C%3A/work/workspace' })
    mockFileSystem(t, {
      'file:///C%3A/work/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { shared: '../../shared' },
      }),
      'file:///c%3A/work/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///C:/work/workspace')
    const { ExternalProjects, ProjectsLookup } = t.services.shared.workspace
    expect(
      ProjectsLookup.ownerProjectId(
        localDependencyUri(URI.file('C:\\work\\shared'), URI.file('C:\\work\\shared\\model.c4')),
      ),
    ).toBe('#file:///c%3A/work/shared')
    expect(ExternalProjects.findByFolder('c:\\work\\shared')?.id).toBe('#file:///c%3A/work/shared')
  })

  it('skips a dependency folder that contains the workspace', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///repo/docs/arch' })
    mockFileSystem(t, {
      'file:///repo/docs/arch/a/likec4.config.json': config({
        name: 'a',
        dependencies: { docs: '../..', repo: '../../..' },
      }),
      'file:///repo/docs/arch/a/model.c4': 'model { component a }',
      'file:///repo/docs/readme.c4': 'model { component readme }',
    })
    await startWorkspace(t, 'file:///repo/docs/arch')

    const { ExternalProjects, ProjectsLookup, LangiumDocuments } = t.services.shared.workspace
    expect(ExternalProjects.all()).toEqual([])
    expect(ExternalProjects.dependencyTargets().size).toBe(0)
    expect(ProjectsLookup.ownerProjectId('file:///repo/docs/arch/a/model.c4')).toBe('a')
    expect(LangiumDocuments.hasDocument(URI.parse('file:///repo/docs/readme.c4'))).toBe(false)
    expect(t.services.likec4.FqnIndex.elements('a' as ProjectId).map(e => e.id).toArray()).toEqual(['a'])
  })

  it('skips a dependency folder that contains a workspace project', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const { ProjectsManager, ExternalProjects } = t.services.shared.workspace
    await t.initialize()
    // project registered outside of workspace folders (e.g. by the CLI)
    await ProjectsManager.registerProject({
      config: { name: 'outside' },
      folderUri: URI.parse('file:///other/root/project'),
    })
    await ProjectsManager.registerProject({
      config: { name: 'a', dependencies: { root: '../../../other/root' } },
      folderUri: URI.parse('file:///test/workspace/a'),
    })
    expect(ExternalProjects.dependencyTargets().size).toBe(0)
  })

  it('creates distinct documents for nested dependency folders', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { outer: '../../deps', inner: '../../deps/inner' },
      }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/deps/outer.c4': 'specification { element component }',
      'file:///test/deps/inner/model.c4': 'model { component inner }',
    })
    await startWorkspace(t, 'file:///test/workspace')

    const { ExternalProjects, LangiumDocuments, ProjectsLookup } = t.services.shared.workspace
    const outer = '#file:///test/deps' as ProjectId
    const inner = '#file:///test/deps/inner' as ProjectId
    expect(ExternalProjects.all().map(p => p.id)).toEqual([outer, inner])
    const uris = LangiumDocuments.all.map(d => d.uri.toString()).toArray()
    expect(new Set(uris).size).toBe(uris.length)
    // the same file is a distinct document in each instance
    const viaOuter = 'likec4-dep://local/test/deps/-/inner/model.c4'
    const viaInner = 'likec4-dep://local/test/deps/inner/-/model.c4'
    expect(uris).toEqual(expect.arrayContaining([viaOuter, viaInner]))
    expect(ProjectsLookup.ownerProjectId(viaOuter)).toBe(outer)
    expect(ProjectsLookup.ownerProjectId(viaInner)).toBe(inner)
    expect(t.services.likec4.FqnIndex.elements(inner).map(e => e.id).toArray()).toEqual(['inner'])

    // remove the inner dependency: its documents are removed, the outer instance keeps its own
    fs.write({
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { outer: '../../deps' } }),
    })
    await ProjectsManager_reload(t)
    expect(ExternalProjects.all().map(p => p.id)).toEqual([outer])
    expect(LangiumDocuments.hasDocument(URI.parse(viaInner))).toBe(false)
    const doc = LangiumDocuments.getDocument(URI.parse(viaOuter))!
    expect(doc.likec4ProjectId).toBe(outer)
    expect(doc.state).toBe(DocumentState.Validated)
    expect(t.services.likec4.FqnIndex.elements(outer).map(e => e.id).toArray()).toEqual(['inner'])
  })

  it('derives the owner of a document from its URI', async ({ create, expect }) => {
    const t = create()
    await t.initialize()
    const external = t.services.shared.workspace.ExternalProjects
    const lookup = t.services.shared.workspace.ProjectsLookup
    const instance = (folder: string, files: string[], id = externalProjectIdOfFolder(folder)): ExternalProject => ({
      id,
      folder: ProjectFolder(folder),
      folderUri: URI.parse(ProjectFolder(folder)),
      configUri: URI.parse(`${ProjectFolder(folder)}likec4.config.json`),
      config: { name: 'x' },
      includeConfig: { paths: [], maxDepth: 3, fileThreshold: 30 },
      hash: 'test',
      files: new Map(files.map(uri => [uri as NormalizedUri, 'model {}'])),
    })
    const outer = '#file:///deps' as ProjectId
    const inner = '#file:///deps/inner' as ProjectId
    const outerDoc = 'likec4-dep://local/deps/-/inner/model.c4'
    const innerDoc = 'likec4-dep://local/deps/inner/-/model.c4'
    // the same id before registration, while registered and after unregister
    expect(external.ownerProjectId(innerDoc)).toBe(inner)
    expect(lookup.ownerProjectId(innerDoc)).toBe(inner)
    external.register(instance('file:///deps', [outerDoc]))
    external.register(instance('file:///deps/inner', [innerDoc]))
    expect(external.ownerProjectId(outerDoc)).toBe(outer)
    expect(external.ownerProjectId(innerDoc)).toBe(inner)
    expect(external.ownerOf(innerDoc)?.id).toBe(inner)
    expect(external.readFile(innerDoc)).toBe('model {}')
    expect(lookup.isIncluded(outer, innerDoc)).toBe(false)
    expect(lookup.isIncluded(inner, innerDoc)).toBe(true)
    external.unregister(inner)
    expect(external.ownerProjectId(innerDoc)).toBe(inner)
    expect(lookup.ownerProjectId(innerDoc)).toBe(inner)
    expect(external.ownerOf(innerDoc)).toBeUndefined()
    expect(external.readFile(innerDoc)).toBeUndefined()
    expect(external.ownerProjectId(outerDoc)).toBe(outer)

    // an instance cannot own documents of another instance
    expect(() => external.register(instance('file:///deps', [innerDoc]))).toThrow()
    expect(() => external.register(instance('file:///deps', [outerDoc], '#other' as ProjectId & `#${string}`)))
      .toThrow()

    // non-local dependencies (git, planned) get their own ids, never the default project
    const gitDoc = 'likec4-dep://github.com/my-org/billing%40abc/-/model.c4'
    expect(external.ownerProjectId(gitDoc)).toBe('#likec4-dep://github.com/my-org/billing@abc')
    expect(lookup.ownerProjectId(gitDoc)).toBe('#likec4-dep://github.com/my-org/billing@abc')

    // file documents are never owned by external projects
    expect(external.ownerProjectId('file:///deps/inner/model.c4')).toBeUndefined()
    expect(lookup.ownerProjectId('file:///deps/inner/model.c4')).toBe('default')
  })

  it('resolves relative icons and links of a local dependency against its real files', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': `
        import { db, nested } from 'shared'
        model {
          component app {
            -> db
          }
        }
      `,
      'file:///test/shared/model.c4': `
        specification {
          element component
        }
        model {
          component db {
            icon ./icons/db.svg
            link ./docs/a.md
            link ../outside.md
            link /docs/b.md
          }
        }
      `,
      'file:///test/shared/nested/more.c4': `
        model {
          component nested {
            icon ../icons/nested.svg
            link ../docs/c.md
          }
        }
      `,
    })
    await startWorkspace(t, 'file:///test/workspace')

    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    const db = model.findElement('@shared.db')!
    expect(db).not.toBeNull()
    expect(db.$element.style.icon).toBe('file:///test/shared/icons/db.svg')
    expect(db.links.map(l => [l.url, l.relative])).toEqual([
      ['./docs/a.md', 'docs/a.md'],
      ['../outside.md', 'file:///test/outside.md'],
      ['/docs/b.md', 'docs/b.md'],
    ])
    const nested = model.findElement('@shared.nested')!
    expect(nested.$element.style.icon).toBe('file:///test/shared/icons/nested.svg')
    expect(nested.links.map(l => l.relative)).toEqual(['docs/c.md'])

    // links of the dependency document (editor) and description files resolve to real files
    const linkProvider = t.services.lsp.DocumentLinkProvider
    const doc = t.services.shared.workspace.LangiumDocuments.getDocument(
      URI.parse('likec4-dep://local/test/shared/-/nested/more.c4'),
    )!
    expect(linkProvider.resolveLink(doc, '../docs/c.md')).toBe('file:///test/shared/docs/c.md')
    expect(linkProvider.resolveLink(doc, '../../outside.md')).toBe('file:///test/outside.md')
    expect(linkProvider.resolveLink(doc, 'docs/d.md')).toBe('file:///test/shared/docs/d.md')
    const links = await linkProvider.getDocumentLinks(doc, { textDocument: { uri: doc.uri.toString() } })
    expect(links.map(l => l.target)).toEqual(['file:///test/shared/docs/c.md'])
  })

  it('asks the client to refresh replaced and removed dependency documents', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/shared/model.c4': sharedModel,
      'file:///test/shared/removed.c4': 'model { component removed }',
      'file:///test/shared/same.c4': 'model { component same }',
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { WorkspaceManager } = t.services.shared.workspace
    const refresh = mockMethod(WorkspaceManager, 'refreshDependencyDocuments')

    fs.write({ 'file:///test/shared/model.c4': 'model { component changed }' })
    fs.remove('file:///test/shared/removed.c4')
    await ProjectsManager_reload(t)

    expect(refresh.mock.calls.flatMap(([uris]) => uris.map(String)).sort()).toEqual([
      'likec4-dep://local/test/shared/-/model.c4',
      'likec4-dep://local/test/shared/-/removed.c4',
    ])
  })

  it('keeps registry and documents consistent when applying is cancelled', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/shared/model.c4': sharedModel,
      'file:///test/shared/removed.c4': 'model { component removed }',
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { ExternalProjects, LangiumDocuments, WorkspaceManager, DocumentBuilder } = t.services.shared.workspace

    fs.write({
      'file:///test/shared/model.c4': 'model { component changed }',
      'file:///test/shared/added.c4': 'model { component added }',
    })
    fs.remove('file:///test/shared/removed.c4')
    const targets = ExternalProjects.dependencyTargets()
    const loaded = await ExternalProjects.loadAll(targets)
    const cancelled = new Cancellation.CancellationTokenSource()
    cancelled.cancel()
    await WorkspaceManager['applyExternalProjects'](targets, loaded, cancelled.token).catch(() => {})

    // registry and documents match, although the build was cancelled
    const registered = ExternalProjects.get('#file:///test/shared')!
    expect([...registered.files.keys()].sort()).toEqual([
      'likec4-dep://local/test/shared/-/added.c4',
      'likec4-dep://local/test/shared/-/model.c4',
    ])
    for (const [uri, text] of registered.files) {
      expect(LangiumDocuments.getDocument(URI.parse(uri))?.textDocument.getText()).toBe(text)
    }
    expect(LangiumDocuments.hasDocument(URI.parse('likec4-dep://local/test/shared/-/removed.c4'))).toBe(false)

    // the next update completes the build
    await DocumentBuilder.update([], [])
    expect(t.services.likec4.FqnIndex.elements('#file:///test/shared' as ProjectId).map(e => e.id).toArray().sort())
      .toEqual(['added', 'changed'])
  })

  it('reads files outside of the workspace lock and serializes syncs', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a' }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { ExternalProjects, LangiumDocuments, ProjectsManager, WorkspaceManager, WorkspaceLock } = t.services
      .shared.workspace

    let inLock = false
    const write = WorkspaceLock.write.bind(WorkspaceLock)
    mockMethod(WorkspaceLock, 'write').mockImplementation(action =>
      write(async token => {
        inLock = true
        try {
          return await action(token)
        } finally {
          inLock = false
        }
      })
    )
    let reading = 0
    let maxConcurrentReads = 0
    const readsInLock = [] as string[]
    fs.readFile.mockImplementation(async uri => {
      if (!uri.toString().startsWith('file:///test/shared/')) {
        return 'model { }'
      }
      if (inLock) {
        readsInLock.push(uri.toString())
      }
      reading++
      maxConcurrentReads = Math.max(maxConcurrentReads, reading)
      await new Promise(resolve => setTimeout(resolve, 5))
      reading--
      return uri.toString().endsWith('model.c4') && uri.toString().includes('shared')
        ? sharedModel
        : 'model { }'
    })

    fs.write({
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
    })
    // concurrent: single config change, two reloads
    await Promise.all([
      ProjectsManager.registerConfigFile(URI.parse('file:///test/workspace/a/likec4.config.json')),
      ProjectsManager.reloadProjects(),
      WorkspaceManager.rebuildAll(),
    ])
    await WorkspaceManager.whenExternalProjectsSynced()

    expect(readsInLock.filter(u => u.includes('/test/shared/'))).toEqual([])
    expect(maxConcurrentReads).toBe(1)
    expect(ExternalProjects.all().map(p => p.id)).toEqual(['#file:///test/shared'])
    expect(LangiumDocuments.all.filter(d => d.uri.toString() === 'likec4-dep://local/test/shared/-/model.c4').count())
      .toBe(1)
  })

  it('does not resync a missing dependency folder on every projects update', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../missing' } }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/workspace/b/likec4.config.json': config({ name: 'b' }),
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { ExternalProjects, ProjectsManager, WorkspaceManager, WorkspaceLock } = t.services.shared.workspace
    expect(ExternalProjects.all()).toEqual([])
    expect(ExternalProjects.hasStructuralChanges()).toBe(false)

    const writes = mockMethod(WorkspaceLock, 'write', WorkspaceLock.write.bind(WorkspaceLock))
    await ProjectsManager.registerProject({
      config: { name: 'b', title: 'changed' },
      configUri: URI.parse('file:///test/workspace/b/likec4.config.json'),
    })
    await WorkspaceManager.whenExternalProjectsSynced()
    expect(writes).not.toHaveBeenCalled()
  })

  it('does not notify model listeners and keeps no model cache for external ids', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///test/workspace')
    const modelBuilder = t.services.likec4.ModelBuilder
    const notified = [] as string[]
    modelBuilder.onModelParsed(projectId => {
      notified.push(projectId)
    })

    // change content (document is deleted and added again)
    fs.write({ 'file:///test/shared/model.c4': 'model { component changed }' })
    await t.services.shared.workspace.ProjectsManager.reloadProjects()
    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()
    // remove the dependency
    fs.write({ 'file:///test/workspace/a/likec4.config.json': config({ name: 'a' }) })
    await t.services.shared.workspace.ProjectsManager.reloadProjects()
    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()

    expect(notified.filter(id => id.startsWith('#'))).toEqual([])
    expect(modelBuilder).toBeInstanceOf(DefaultLikeC4ModelBuilder)
    if (modelBuilder instanceof DefaultLikeC4ModelBuilder) {
      expect(modelBuilder['cache'].has('#file:///test/shared' as ProjectId)).toBe(false)
    }
  })

  it('applies a sync requested by a reload after the rebuild of the reload', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a' }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { DocumentBuilder, ExternalProjects, ProjectsManager, WorkspaceManager } = t.services.shared.workspace

    const events = [] as string[]
    const update = DocumentBuilder.update.bind(DocumentBuilder)
    mockMethod(DocumentBuilder, 'update').mockImplementation(async (changed, deleted, token) => {
      events.push('update:start')
      try {
        return await update(changed, deleted, token)
      } finally {
        events.push('update:end')
      }
    })
    const register = ExternalProjects.register.bind(ExternalProjects)
    mockMethod(ExternalProjects, 'register').mockImplementation(project => {
      events.push('register')
      register(project)
    })

    fs.write({
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
    })
    // Without the workspace lock (as the ReloadProjects request does)
    await ProjectsManager.reloadProjects()
    await WorkspaceManager.whenExternalProjectsSynced()

    expect(ExternalProjects.has('#file:///test/shared')).toBe(true)
    // rebuild of the reload completes before the sync is applied
    expect(events.slice(0, 3)).toEqual(['update:start', 'update:end', 'register'])
  })

  it('attributes deleted documents of a removed instance to it, not to the default project', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/workspace/b/likec4.config.json': config({ name: 'b' }),
      'file:///test/workspace/b/model.c4': 'model { }',
      'file:///test/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { ProjectsManager, WorkspaceManager, ExternalProjects } = t.services.shared.workspace
    // multiple projects: no default project
    expect(ProjectsManager.defaultProjectId).toBeUndefined()

    const modelBuilder = t.services.likec4.ModelBuilder
    const notified = [] as string[]
    modelBuilder.onModelParsed(projectId => {
      notified.push(projectId)
    })

    fs.write({ 'file:///test/workspace/a/likec4.config.json': config({ name: 'a' }) })
    await ProjectsManager.reloadProjects()
    await WorkspaceManager.whenExternalProjectsSynced()

    expect(ExternalProjects.all()).toEqual([])
    expect(notified).not.toContain('default')
    expect(notified.filter(id => id.startsWith('#'))).toEqual([])
    // deleted documents are still attributed to the removed instance (derived from the URI)
    expect(t.services.shared.workspace.ProjectsLookup.ownerProjectId('likec4-dep://local/test/shared/-/model.c4')).toBe(
      '#file:///test/shared',
    )
    expect(modelBuilder).toBeInstanceOf(DefaultLikeC4ModelBuilder)
    if (modelBuilder instanceof DefaultLikeC4ModelBuilder) {
      expect(modelBuilder['cache'].has('default' as ProjectId)).toBe(false)
    }
  })

  it('does not take the workspace lock when a reload finds no changes', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': 'model { }',
      'file:///test/shared/model.c4': sharedModel,
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { ProjectsManager, WorkspaceManager, WorkspaceLock, ExternalProjects } = t.services.shared.workspace

    const writes = mockMethod(WorkspaceLock, 'write', WorkspaceLock.write.bind(WorkspaceLock))
    await ProjectsManager.reloadProjects()
    await WorkspaceManager.whenExternalProjectsSynced()
    expect(writes).not.toHaveBeenCalled()
    expect(ExternalProjects.has('#file:///test/shared')).toBe(true)
  })

  it('never asks ProjectsManager about documents of external projects', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/workspace/a/model.c4': `
        import { api } from 'shared'
        model {
          component app {
            -> api
          }
        }
      `,
      'file:///test/shared/model.c4': sharedModel,
    })
    const pm = t.services.shared.workspace.ProjectsManager
    const asked = [] as string[]
    const record = (arg: unknown) => {
      const value = typeof arg === 'object' && arg !== null && 'uri' in arg ? String(arg.uri) : String(arg)
      if (value.startsWith('likec4-dep:')) {
        asked.push(value)
      }
    }
    const ownerProjectId = pm.ownerProjectId.bind(pm)
    mockMethod(pm, 'ownerProjectId').mockImplementation(doc => {
      record(doc)
      return ownerProjectId(doc)
    })
    const isIncluded = pm.isIncluded.bind(pm)
    mockMethod(pm, 'isIncluded').mockImplementation((projectId, doc) => {
      record(doc)
      return isIncluded(projectId, doc)
    })
    const isExcluded = pm.isExcluded.bind(pm) as (...args: unknown[]) => boolean
    mockMethod(pm, 'isExcluded').mockImplementation(
      ((...args: unknown[]) => {
        record(args.at(-1))
        return isExcluded(...args)
      }) as typeof pm.isExcluded,
    )
    const getProject = pm.getProject.bind(pm)
    mockMethod(pm, 'getProject').mockImplementation(arg => {
      record(arg)
      return getProject(arg)
    })

    await startWorkspace(t, 'file:///test/workspace')
    await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    fs.write({ 'file:///test/shared/model.c4': 'model { component api }' })
    await ProjectsManager_reload(t)
    await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(t.services.shared.workspace.LangiumDocuments.hasDocument(
      URI.parse('likec4-dep://local/test/shared/-/model.c4'),
    )).toBe(true)
    // DocumentSymbolProvider asks ProjectsManager.isExcluded (not ownership), it is not called here
    expect(asked).toEqual([])
  })

  it('keeps a workspace without dependencies unchanged', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a' }),
      'file:///test/workspace/a/model.c4': sharedModel,
      'file:///test/outside/model.c4': 'model { component outside }',
    })
    await startWorkspace(t, 'file:///test/workspace')
    const { ExternalProjects, ProjectsLookup, ProjectsManager } = t.services.shared.workspace
    expect(ExternalProjects.all()).toEqual([])
    const doc = 'file:///test/workspace/a/model.c4'
    expect(ProjectsLookup.ownerProjectId(doc)).toBe(ProjectsManager.ownerProjectId(doc))
    expect(ProjectsLookup.isExcluded(doc)).toBe(ProjectsManager.isExcluded(doc))
    expect(ProjectsLookup.isIncluded('a' as ProjectId, doc)).toBe(true)
    await ProjectsManager.reloadProjects()
    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()
    expect(ExternalProjects.all()).toEqual([])
  })
})

const SHA_V1 = '1'.repeat(40)
const SHA_V2 = '2'.repeat(40)
const BILLING_URL = 'https://github.com/my-org/billing.git'

/**
 * Simulates installation of a git dependency: writes the version index record and the cache entry to the storage
 */
async function installGit(
  t: TestServices,
  { url = BILLING_URL, ref, sha, subdir = '', files }: {
    url?: string
    ref: string
    sha: string
    subdir?: string
    files: Record<string, string>
  },
): Promise<GitDependencyInstance> {
  const repository = parseGitRepositoryUrl(url)!.id
  const storage = t.services.shared.dependencies.Storage
  await storage.writeVersion({ format: 1, repository, url, ref, sha, resolvedAt: '2026-11-15T00:00:00.000Z' })
  await storage.writeEntry({ format: 1, repository, url, sha, subdir, files })
  return { repository, sha, subdir }
}

/**
 * Installer of a host that supports git (never called in these tests)
 */
const supportedInstaller = (): DependencyInstaller => ({
  supported: true,
  install: () => Promise.resolve({ status: 'failed', error: 'not expected in tests' }),
})

/**
 * Starts the workspace as the language server does (`initialized`: startup and initial build under the write-lock)
 */
/**
 * Captures warnings of the language server logger (replaces the noop sink of the test services)
 */
function captureWarnings(): string[] {
  const warnings = [] as string[]
  configureLogger({
    sinks: {
      console: record => {
        if (record.level === 'warning') {
          warnings.push(String(record.rawMessage))
        }
      },
    },
  })
  return warnings
}

async function startWithGit(t: TestServices) {
  const workspaceFolder: WorkspaceFolder = { name: 'workspace', uri: 'file:///test/workspace' }
  const { WorkspaceManager } = t.services.shared.workspace
  WorkspaceManager.initialize({
    capabilities: {},
    processId: null,
    rootUri: workspaceFolder.uri,
    workspaceFolders: [workspaceFolder],
  })
  await WorkspaceManager.initialized({})
  // syncs queued by the startup (retries) take the write-lock: do not build concurrently outside of it
  await WorkspaceManager.whenExternalProjectsSynced()
  await buildAll(t)
}

const billingV1 = `
specification {
  element service
}
model {
  service invoices
  service payments
}
`

const billingV2 = `
specification {
  element service
}
model {
  service invoices
  service refunds
}
`

const consumerModel = (name: string) => `
import { invoices } from '${name}'

specification {
  element system
}
model {
  system webapp {
    -> invoices 'creates invoices'
  }
}
views {
  view index {
    include *
  }
}
`

describe('ExternalProjects: git dependencies', () => {
  it('registers an installed instance: the import resolves', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
    })
    const instance = await installGit(t, {
      ref: 'v1',
      sha: SHA_V1,
      files: {
        'likec4.config.json': config({ name: 'billing-core' }),
        'model.c4': billingV1,
        'README.md': '# not a document',
      },
    })
    await startWithGit(t)

    const { ExternalProjects, LangiumDocuments, DependencyResolver, ProjectsManager } = t.services.shared.workspace
    const id = externalProjectIdOfGitInstance(instance)
    expect(id).toBe(`#likec4-dep://github.com/my-org/billing@${SHA_V1}`)
    const registered = ExternalProjects.get(id)!
    expect(registered.config.name).toBe('billing-core')
    expect(registered.git).toEqual(instance)
    expect([...registered.files.keys()]).toEqual([gitDependencyUri(instance, 'model.c4').toString()])
    expect(LangiumDocuments.hasDocument(gitDependencyUri(instance, 'model.c4'))).toBe(true)
    // not a workspace project
    expect([...ProjectsManager.all]).not.toContain(id)
    expect(DependencyResolver.resolve('a' as ProjectId, 'billing')).toEqual({ kind: 'external', projectId: id })

    const consumerDoc = LangiumDocuments.getDocument(URI.parse('file:///test/workspace/a/model.c4'))!
    expect(consumerDoc.references.filter(ref => ref.error).map(ref => ref.error?.message)).toEqual([])
    expect(consumerDoc.diagnostics ?? []).toEqual([])

    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
    expect(model.$data.importedProjects?.['billing' as ProjectId]).toEqual({
      name: 'billing-core',
      source: { kind: 'git', url: BILLING_URL, ref: 'v1', sha: SHA_V1 },
    })
    expect([...model.relationships()].map(r => `${r.source.id} -> ${r.target.id}`)).toEqual([
      'webapp -> @billing.invoices',
    ])
    // internal ids of external projects do not leak into the model
    expect(JSON.stringify(model.$data)).not.toMatch(/"#|@#/)

    expect(t.services.shared.dependencies.States.get('a' as ProjectId, 'billing')).toEqual({
      status: 'installed',
      consumer: 'a',
      name: 'billing',
      source: { git: BILLING_URL, ref: 'v1' },
      instance,
      projectId: id,
      filesWithErrors: 0,
    })
  })

  it('shares one set of documents between consumers of the same SHA', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'main' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
      'file:///test/workspace/b/likec4.config.json': config({
        name: 'b',
        // another URL form of the same repository, another import name
        dependencies: { invoicing: { git: 'git@github.com:my-org/billing.git', ref: 'main' } },
      }),
      'file:///test/workspace/b/model.c4': consumerModel('invoicing'),
    })
    const instance = await installGit(t, {
      ref: 'main',
      sha: SHA_V1,
      files: { 'model.c4': billingV1, 'nested/more.c4': 'model { service more }' },
    })
    await startWithGit(t)

    const { ExternalProjects, LangiumDocuments } = t.services.shared.workspace
    expect(ExternalProjects.all().map(p => p.id)).toEqual([externalProjectIdOfGitInstance(instance)])
    const depDocs = LangiumDocuments.all.filter(d => d.uri.scheme === 'likec4-dep').toArray()
    expect(depDocs).toHaveLength(2)
    // without config, the repository name is used
    expect(ExternalProjects.all()[0]!.config.name).toBe('billing')

    for (const [consumer, name] of [['a', 'billing'], ['b', 'invoicing']] as const) {
      const model = await t.services.likec4.ModelBuilder.computeModel(consumer as ProjectId)
      expect(model.$data.imports[name as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
    }
    // no user info in the model
    const b = await t.services.likec4.ModelBuilder.computeModel('b' as ProjectId)
    expect(b.$data.importedProjects?.['invoicing' as ProjectId]?.source).toMatchObject({
      kind: 'git',
      url: 'github.com:my-org/billing.git',
    })
  })

  it('loads different SHAs of one repository side by side', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': `
        import { invoices, payments } from 'billing'
        model { }
      `,
      'file:///test/workspace/b/likec4.config.json': config({
        name: 'b',
        dependencies: { billing: { git: BILLING_URL, ref: 'v2' } },
      }),
      'file:///test/workspace/b/model.c4': `
        import { invoices, refunds } from 'billing'
        model { }
      `,
    })
    const v1 = await installGit(t, { ref: 'v1', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    const v2 = await installGit(t, { ref: 'v2', sha: SHA_V2, files: { 'model.c4': billingV2 } })
    await startWithGit(t)

    const { ExternalProjects, LangiumDocuments } = t.services.shared.workspace
    expect(ExternalProjects.all().map(p => p.id).sort()).toEqual(
      [externalProjectIdOfGitInstance(v1), externalProjectIdOfGitInstance(v2)].sort(),
    )
    expect(LangiumDocuments.all.filter(d => d.uri.scheme === 'likec4-dep').toArray()).toHaveLength(2)

    const a = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(a.$data.imports['billing' as ProjectId]?.map(e => e.id).sort()).toEqual(['invoices', 'payments'])
    const b = await t.services.likec4.ModelBuilder.computeModel('b' as ProjectId)
    expect(b.$data.imports['billing' as ProjectId]?.map(e => e.id).sort()).toEqual(['invoices', 'refunds'])

    for (const uri of ['file:///test/workspace/a/model.c4', 'file:///test/workspace/b/model.c4']) {
      const doc = LangiumDocuments.getDocument(URI.parse(uri))!
      expect(doc.references.filter(ref => ref.error).map(ref => ref.error?.message)).toEqual([])
    }
  })

  it('reports a dependency that is not installed and builds other views of the consumer', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace', context: { dependencyInstaller: supportedInstaller } })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: {
          // no SHA in the version index
          billing: { git: BILLING_URL, ref: 'v1' },
          // SHA in the version index, but no instance in the storage
          platform: { git: 'https://github.com/my-org/platform.git', ref: 'main' },
        },
      }),
      'file:///test/workspace/a/model.c4': `
        import { invoices } from 'billing'
        specification {
          element system
        }
        model {
          system webapp
          system backend
          webapp -> backend
        }
        views {
          view index {
            include *
          }
        }
      `,
    })
    await t.services.shared.dependencies.Storage.writeVersion({
      format: 1,
      repository: 'github.com/my-org/platform',
      url: 'https://github.com/my-org/platform.git',
      ref: 'main',
      sha: SHA_V1,
      resolvedAt: '2026-11-15T00:00:00.000Z',
    })
    await startWithGit(t)

    const { States } = t.services.shared.dependencies
    expect(States.all('a' as ProjectId).map(s => [s.name, s.status])).toEqual([
      ['billing', 'not-installed'],
      ['platform', 'not-installed'],
    ])
    expect(t.services.shared.workspace.ExternalProjects.all()).toEqual([])
    expect(t.services.shared.workspace.DependencyResolver.resolve('a' as ProjectId, 'billing')).toBeUndefined()

    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports).toEqual({})
    expect(model.view('index').$view.nodes.map(n => n.id).sort()).toEqual(['backend', 'webapp'])
  })

  it('reports unsupported when the host cannot install and the dependency is not installed', async ({ create, expect }) => {
    // default test services: the installer is not supported
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: {
          billing: { git: BILLING_URL, ref: 'v1' },
          installed: { git: 'https://github.com/my-org/installed.git', ref: 'v1' },
        },
      }),
      'file:///test/workspace/a/model.c4': 'model { }',
    })
    await installGit(t, {
      url: 'https://github.com/my-org/installed.git',
      ref: 'v1',
      sha: SHA_V1,
      files: { 'model.c4': billingV1 },
    })
    await startWithGit(t)
    const { States } = t.services.shared.dependencies
    expect(States.get('a' as ProjectId, 'billing')?.status).toBe('unsupported')
    // installed in the storage: registered regardless of installer support
    expect(States.get('a' as ProjectId, 'installed')?.status).toBe('installed')
  })

  it('resolves the import after install without a restart', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace', context: { dependencyInstaller: supportedInstaller } })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
    })
    await startWithGit(t)
    const { WorkspaceManager, LangiumDocuments, ExternalProjects } = t.services.shared.workspace
    const { States } = t.services.shared.dependencies
    expect(States.get('a' as ProjectId, 'billing')?.status).toBe('not-installed')
    const consumerDoc = () => LangiumDocuments.getDocument(URI.parse('file:///test/workspace/a/model.c4'))!
    expect(consumerDoc().references.some(ref => ref.error)).toBe(true)

    const events = [] as unknown[]
    States.onDidChange(e => events.push(e))
    const refresh = mockMethod(WorkspaceManager, 'refreshDependencyDocuments')

    // the relink build already sees the new state, the event is fired after the write-lock is released
    const statesInRelink = [] as Array<string | undefined>
    t.services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Linked, doc => {
      if (doc.uri.toString() === 'file:///test/workspace/a/model.c4') {
        statesInRelink.push(States.get('a' as ProjectId, 'billing')?.status)
      }
    })
    const lock = t.services.shared.workspace.WorkspaceLock
    const write = lock.write.bind(lock)
    let writing = 0
    const writes = mockMethod(lock, 'write').mockImplementation(async action => {
      writing++
      try {
        return await write(action)
      } finally {
        writing--
      }
    })
    const firedUnderLock = [] as boolean[]
    States.onDidChange(() => firedUnderLock.push(writing > 0))

    // the editor asked for a document before install (a tab opened while not installed)
    const provider = t.services.shared.lsp.TextDocumentContentProvider
    expect(provider).toBeInstanceOf(LikeC4TextDocumentContentProvider)
    const requestedUri = gitDependencyUri(
      { repository: 'github.com/my-org/billing', sha: SHA_V1, subdir: '' },
      'model.c4',
    ).toString()
    expect(await provider!.provideTextDocumentContent({ uri: requestedUri }, Cancellation.CancellationToken.None))
      .toBeUndefined()

    const instance = await installGit(t, {
      ref: 'v1',
      sha: SHA_V1,
      files: { 'model.c4': billingV1, 'other.c4': 'model { }' },
    })
    await WorkspaceManager.syncExternalProjects()
    await buildAll(t)
    expect(statesInRelink).toEqual(['installed'])
    expect(firedUnderLock).toEqual([false])

    expect(ExternalProjects.has(externalProjectIdOfGitInstance(instance))).toBe(true)
    expect(consumerDoc().references.filter(ref => ref.error).map(ref => ref.error?.message)).toEqual([])
    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
    expect(States.get('a' as ProjectId, 'billing')?.status).toBe('installed')
    expect(events).toEqual([{ consumers: ['a'] }])
    // only the added document the editor asked for is refreshed
    expect(refresh.mock.calls.flatMap(([uris]) => uris.map(String))).toEqual([requestedUri])
    expect(await provider!.provideTextDocumentContent({ uri: requestedUri }, Cancellation.CancellationToken.None))
      .toEqual({ text: billingV1 })

    // nothing changed: no event, no write-lock
    writes.mockClear()
    await WorkspaceManager.syncExternalProjects()
    expect(writes).not.toHaveBeenCalled()
    expect(events).toHaveLength(1)
  })

  it('switches consumers to another SHA and removes the unused instance', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'main' } },
      }),
      'file:///test/workspace/a/model.c4': `
        import { invoices } from 'billing'
        model { }
      `,
    })
    const v1 = await installGit(t, { ref: 'main', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    await startWithGit(t)
    // `update` moved the ref to another SHA
    const v2 = await installGit(t, { ref: 'main', sha: SHA_V2, files: { 'model.c4': billingV2 } })
    const refresh = mockMethod(t.services.shared.workspace.WorkspaceManager, 'refreshDependencyDocuments')
    await t.services.shared.workspace.WorkspaceManager.syncExternalProjects()
    // editors showing removed documents re-request their content
    expect(refresh.mock.calls.flatMap(([uris]) => uris.map(String))).toEqual([
      gitDependencyUri(v1, 'model.c4').toString(),
    ])

    const { ExternalProjects, LangiumDocuments } = t.services.shared.workspace
    expect(ExternalProjects.all().map(p => p.id)).toEqual([externalProjectIdOfGitInstance(v2)])
    expect(LangiumDocuments.hasDocument(gitDependencyUri(v1, 'model.c4'))).toBe(false)
    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
    expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).not.toContain('payments')
    expect(t.services.likec4.FqnIndex.elements(externalProjectIdOfGitInstance(v2)).map(e => e.id).toArray().sort())
      .toEqual(['invoices', 'refunds'])
  })

  it('publishes no diagnostics for documents of an instance and counts files with parse errors', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
    })
    const instance = await installGit(t, {
      ref: 'v1',
      sha: SHA_V1,
      files: {
        'model.c4': billingV1,
        'broken.c4': 'model { this is not valid syntax',
        'also-broken.likec4': 'specification { element }}}',
        'unresolved.c4': 'model { invoices -> unknown }',
      },
    })
    const published = [] as Array<{ uri: string; diagnostics: unknown[] }>
    const connection = {
      sendDiagnostics: async (params: { uri: string; diagnostics: unknown[] }) => {
        published.push(params)
      },
    }
    addDiagnosticsHandler(connection as unknown as Connection, t.services.shared)
    await startWithGit(t)

    const external = published.filter(p => p.uri.startsWith('likec4-dep://'))
    expect(external.flatMap(p => p.diagnostics)).toEqual([])
    const doc = t.services.shared.workspace.LangiumDocuments.getDocument(gitDependencyUri(instance, 'broken.c4'))!
    expect(doc.parseResult.parserErrors.length).toBeGreaterThan(0)
    expect(doc.diagnostics ?? []).toEqual([])

    const state = t.services.shared.dependencies.States.get('a' as ProjectId, 'billing')
    expect(state).toMatchObject({ status: 'installed', filesWithErrors: 2 })
    // the import still resolves (parsing is best effort)
    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
  })

  it('ignores include paths of the dependency config', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1', path: 'architecture' } },
      }),
      'file:///test/workspace/a/model.c4': 'model { }',
    })
    const instance = await installGit(t, {
      ref: 'v1',
      sha: SHA_V1,
      subdir: 'architecture',
      files: {
        'likec4.config.json': config({ name: 'billing-arch', include: { paths: ['../shared', '../../../workspace'] } }),
        'model.c4': billingV1,
      },
    })
    await startWithGit(t)
    const { ExternalProjects, LangiumDocuments } = t.services.shared.workspace
    const registered = ExternalProjects.get(externalProjectIdOfGitInstance(instance))!
    expect(registered.config.name).toBe('billing-arch')
    expect(registered.includeConfig.paths).toEqual([])
    expect(registered.folder).toBe(`likec4-dep://github.com/my-org/billing%40${SHA_V1}/architecture/-/`)
    expect(t.services.shared.workspace.DependencyResolver.resolveWithMeta('a' as ProjectId, 'billing')?.meta.source)
      .toEqual({ kind: 'git', url: BILLING_URL, ref: 'v1', path: 'architecture', sha: SHA_V1 })
    expect(LangiumDocuments.all.filter(d => d.uri.scheme === 'likec4-dep').map(d => d.uri.toString()).toArray())
      .toEqual([gitDependencyUri(instance, 'model.c4').toString()])
    // nothing was read from the file system for the dependency
    expect(
      fs.readFile.mock.calls.map(([uri]) => uri.toString()).filter(uri => !uri.startsWith('file:///test/workspace')),
    )
      .toEqual([])
  })

  it('serves the content of a document by its virtual URI', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': 'model { }',
    })
    const instance = await installGit(t, { ref: 'v1', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    // requested before the startup completes (e.g. a tab restored by the editor)
    const start = startWithGit(t)
    const provider = t.services.shared.lsp.TextDocumentContentProvider!
    expect(provider.schemes).toEqual(['likec4-dep'])
    const uri = gitDependencyUri(instance, 'model.c4').toString()
    const content = provider.provideTextDocumentContent({ uri }, Cancellation.CancellationToken.None)
    await start
    expect(await content).toEqual({ text: billingV1 })
    // the file system of dependency documents reads it from memory
    const dependencyFs = new DependencyFileSystem(t.services.shared)
    expect(dependencyFs.readFile(URI.parse(uri))).toBe(billingV1)
    expect(dependencyFs.stat(URI.parse(uri))).toMatchObject({ isFile: true })
    expect(() => dependencyFs.stat(gitDependencyUri(instance, 'missing.c4'))).toThrow()
    expect(
      await provider.provideTextDocumentContent(
        { uri: gitDependencyUri(instance, 'missing.c4').toString() },
        Cancellation.CancellationToken.None,
      ),
    ).toBeUndefined()
    expect(
      await provider.provideTextDocumentContent(
        { uri: 'file:///test/workspace/a/model.c4' },
        Cancellation.CancellationToken.None,
      ),
    ).toBeUndefined()
  })

  it('keeps a shared instance when one consumer switches to another SHA', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
      'file:///test/workspace/b/likec4.config.json': config({
        name: 'b',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/b/model.c4': consumerModel('billing'),
    })
    const v1 = await installGit(t, { ref: 'v1', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    const v2 = await installGit(t, { ref: 'v2', sha: SHA_V2, files: { 'model.c4': billingV2 } })
    await startWithGit(t)
    const { ExternalProjects, DocumentBuilder, LangiumDocuments, ProjectsManager, WorkspaceManager } =
      t.services.shared.workspace

    // documents relinked by the sync of external projects (the reload itself rebuilds all documents):
    // the sync sets git resolutions, then relinks with the next update
    const relinked = [] as string[]
    let applying = false
    const setGitResolutions = ExternalProjects.setGitResolutions.bind(ExternalProjects)
    mockMethod(ExternalProjects, 'setGitResolutions').mockImplementation(resolutions => {
      applying = true
      return setGitResolutions(resolutions)
    })
    const update = DocumentBuilder.update.bind(DocumentBuilder)
    mockMethod(DocumentBuilder, 'update').mockImplementation((changed, deleted, token) => {
      if (applying) {
        applying = false
        relinked.push(...changed.map(String))
      }
      return update(changed, deleted, token)
    })
    fs.write({
      'file:///test/workspace/b/likec4.config.json': config({
        name: 'b',
        dependencies: { billing: { git: BILLING_URL, ref: 'v2' } },
      }),
    })
    await ProjectsManager.reloadProjects()
    await WorkspaceManager.whenExternalProjectsSynced()
    await buildAll(t)

    expect(ExternalProjects.all().map(p => p.id).sort()).toEqual(
      [externalProjectIdOfGitInstance(v1), externalProjectIdOfGitInstance(v2)].sort(),
    )
    expect(LangiumDocuments.hasDocument(gitDependencyUri(v1, 'model.c4'))).toBe(true)
    // the sync relinks only the consumer that switched
    expect(relinked).toEqual(['file:///test/workspace/b/model.c4'])
    const b = await t.services.likec4.ModelBuilder.computeModel('b' as ProjectId)
    expect(b.$data.importedProjects?.['billing' as ProjectId]?.source).toMatchObject({ sha: SHA_V2 })
    const a = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(a.$data.importedProjects?.['billing' as ProjectId]?.source).toMatchObject({ sha: SHA_V1 })
  })

  it('keeps installed instances and states when the storage cannot be read', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace', context: { dependencyInstaller: supportedInstaller } })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: {
          billing: { git: BILLING_URL, ref: 'v1' },
          missing: { git: 'https://github.com/my-org/missing.git', ref: 'v1' },
        },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
    })
    const instance = await installGit(t, { ref: 'v1', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    await startWithGit(t)
    const { ExternalProjects, WorkspaceManager } = t.services.shared.workspace
    const { States, Storage } = t.services.shared.dependencies
    const id = externalProjectIdOfGitInstance(instance)
    const statesBefore = States.all()
    expect(statesBefore.map(s => s.status)).toEqual(['installed', 'not-installed'])
    const events = [] as unknown[]
    States.onDidChange(e => events.push(e))
    const warnings = captureWarnings()

    // the batch read of instances fails
    const readEntries = mockMethod(Storage, 'readEntries').mockRejectedValue(new Error('storage is unavailable'))
    await WorkspaceManager.syncExternalProjects()
    expect(ExternalProjects.has(id)).toBe(true)
    expect(States.all()).toEqual(statesBefore)
    readEntries.mockRestore()

    // reading versions fails
    const readVersion = mockMethod(Storage, 'readVersion').mockRejectedValue(new Error('storage is unavailable'))
    await WorkspaceManager.syncExternalProjects()
    expect(ExternalProjects.has(id)).toBe(true)
    expect(States.all()).toEqual(statesBefore)
    readVersion.mockRestore()

    expect(events).toEqual([])
    expect(warnings).toEqual([
      'Failed to read git dependencies from the dependency storage, the previous state is kept',
      'Failed to read the version of {repository}@{ref}, the previous state is kept',
      'Failed to read the version of {repository}@{ref}, the previous state is kept',
    ])
    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
  })

  it('retries once when the storage cannot be read at startup, without a state meanwhile', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace', context: { dependencyInstaller: supportedInstaller } })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
    })
    const instance = await installGit(t, { ref: 'v1', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    const { Storage, States } = t.services.shared.dependencies
    const readEntries = Storage.readEntries.bind(Storage)
    const statesSeen = [] as Array<string | undefined>
    const reads = mockMethod(Storage, 'readEntries').mockImplementation(async instances => {
      statesSeen.push(States.get('a' as ProjectId, 'billing')?.status)
      if (reads.mock.calls.length === 1) {
        throw new Error('storage is unavailable')
      }
      return readEntries(instances)
    })
    const events = [] as Array<string | undefined>
    States.onDidChange(() => events.push(States.get('a' as ProjectId, 'billing')?.status))
    await startWithGit(t)
    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()
    await buildAll(t)

    expect(reads).toHaveBeenCalledTimes(2)
    // the startup could not read: no state (no "install" advice) until the retry
    expect(statesSeen).toEqual([undefined, undefined])
    expect(events).toEqual(['installed'])
    expect(States.get('a' as ProjectId, 'billing')?.status).toBe('installed')
    expect(t.services.shared.workspace.ExternalProjects.has(externalProjectIdOfGitInstance(instance))).toBe(true)
    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports['billing' as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
  })

  it('does not retry a storage that keeps failing more than once', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace', context: { dependencyInstaller: supportedInstaller } })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
    })
    const { Storage, States } = t.services.shared.dependencies
    const reads = mockMethod(Storage, 'readVersion').mockRejectedValue(new Error('storage is unavailable'))
    await startWithGit(t)
    const { WorkspaceManager, ExternalProjects } = t.services.shared.workspace
    await WorkspaceManager.whenExternalProjectsSynced()
    // startup and one retry
    expect(reads).toHaveBeenCalledTimes(2)
    expect(States.get('a' as ProjectId, 'billing')).toBeUndefined()
    // the target is not marked as synced: the next sync reads again
    expect(ExternalProjects.hasStructuralChanges()).toBe(true)
  })

  it('does not hang the startup on a storage that does not answer', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
    })
    const instance = await installGit(t, { ref: 'v1', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    const { WorkspaceManager, ExternalProjects } = t.services.shared.workspace
    WorkspaceManager['startupStorageTimeout'] = 20
    const { Storage, States } = t.services.shared.dependencies
    const readVersion = Storage.readVersion.bind(Storage)
    const reads = mockMethod(Storage, 'readVersion').mockImplementation((repository, ref) => {
      if (reads.mock.calls.length === 1) {
        // answers after the startup timeout
        return new Promise(resolve => setTimeout(() => resolve(readVersion(repository, ref)), 200))
      }
      return readVersion(repository, ref)
    })
    const warnings = captureWarnings()
    // registered instances when the startup builds the workspace
    const instancesAtInitialBuild = [] as number[]
    const { DocumentBuilder } = t.services.shared.workspace
    const build = DocumentBuilder.build.bind(DocumentBuilder)
    mockMethod(DocumentBuilder, 'build').mockImplementation((documents, options, token) => {
      instancesAtInitialBuild.push(ExternalProjects.all().length)
      return build(documents, options, token)
    })
    await startWithGit(t)
    // the startup did not wait for the storage
    expect(instancesAtInitialBuild[0]).toBe(0)
    expect(warnings).toContain(
      'Dependency storage did not answer within {timeout} ms, git dependencies are loaded later',
    )

    // a structural sync after the startup loads it
    await WorkspaceManager.whenExternalProjectsSynced()
    await buildAll(t)
    expect(ExternalProjects.has(externalProjectIdOfGitInstance(instance))).toBe(true)
    expect(States.get('a' as ProjectId, 'billing')?.status).toBe('installed')
    const doc = t.services.shared.workspace.LangiumDocuments.getDocument(
      URI.parse('file:///test/workspace/a/model.c4'),
    )!
    expect(doc.references.filter(ref => ref.error).map(ref => ref.error?.message)).toEqual([])
  })

  it('reads local dependencies once at startup, together with git dependencies', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    const fs = mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' }, shared: '../../shared' },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
      'file:///test/shared/model.c4': sharedModel,
    })
    await installGit(t, { ref: 'v1', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    await startWithGit(t)
    await t.services.shared.workspace.WorkspaceManager.whenExternalProjectsSynced()
    expect(fs.readFile.mock.calls.map(([uri]) => uri.toString()).filter(uri => uri.startsWith('file:///test/shared/')))
      .toEqual(['file:///test/shared/model.c4'])
    expect(t.services.shared.workspace.ExternalProjects.all()).toHaveLength(2)
  })

  it('removes user info from the URL of the imported project', async ({ expect }) => {
    expect(withoutUserInfo('https://token@github.com/my-org/billing.git')).toBe('https://github.com/my-org/billing.git')
    expect(withoutUserInfo('https://user:secret@github.com/my-org/billing.git'))
      .toBe('https://github.com/my-org/billing.git')
    expect(withoutUserInfo('ssh://git@github.com:2222/my-org/billing.git')).toBe(
      'ssh://github.com:2222/my-org/billing.git',
    )
    expect(withoutUserInfo('git@github.com:my-org/billing.git')).toBe('github.com:my-org/billing.git')
    expect(withoutUserInfo('https://github.com/my-org/billing.git')).toBe('https://github.com/my-org/billing.git')
    expect(withoutUserInfo('https://github.com/my-org/a@b.git')).toBe('https://github.com/my-org/a@b.git')
  })

  it('gives nested subdirectories of one commit distinct owners', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: {
          arch: { git: BILLING_URL, ref: 'v1', path: 'arch' },
          sub: { git: BILLING_URL, ref: 'v1', path: 'arch/sub' },
        },
      }),
      'file:///test/workspace/a/model.c4': `
        import { invoices } from 'arch'
        import { refunds } from 'sub'
        model { }
      `,
    })
    const arch = await installGit(t, {
      ref: 'v1',
      sha: SHA_V1,
      subdir: 'arch',
      files: { 'sub/model.c4': billingV1 },
    })
    const sub = await installGit(t, {
      ref: 'v1',
      sha: SHA_V1,
      subdir: 'arch/sub',
      files: { 'model.c4': billingV2 },
    })
    await startWithGit(t)
    const { ExternalProjects, ProjectsLookup } = t.services.shared.workspace
    const archId = externalProjectIdOfGitInstance(arch)
    const subId = externalProjectIdOfGitInstance(sub)
    expect(archId).not.toBe(subId)
    expect(ExternalProjects.all().map(p => p.id).sort()).toEqual([archId, subId].sort())
    expect(ProjectsLookup.ownerProjectId(gitDependencyUri(arch, 'sub/model.c4'))).toBe(archId)
    expect(ProjectsLookup.ownerProjectId(gitDependencyUri(sub, 'model.c4'))).toBe(subId)
    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports['arch' as ProjectId]?.map(e => e.id)).toEqual(['invoices'])
    expect(model.$data.imports['sub' as ProjectId]?.map(e => e.id)).toEqual(['refunds'])
  })

  it('does not fall back to a workspace project of the same name while not installed', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': consumerModel('billing'),
      'file:///test/workspace/billing/likec4.config.json': config({ name: 'billing' }),
      'file:///test/workspace/billing/model.c4': billingV1,
    })
    await startWithGit(t)
    const { DependencyResolver } = t.services.shared.workspace
    expect(DependencyResolver.resolve('a' as ProjectId, 'billing')).toBeUndefined()
    const model = await t.services.likec4.ModelBuilder.computeModel('a' as ProjectId)
    expect(model.$data.imports).toEqual({})
  })

  it('does not resolve to the previous instance after the source changed, until the sync', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({
        name: 'a',
        dependencies: { billing: { git: BILLING_URL, ref: 'v1' } },
      }),
      'file:///test/workspace/a/model.c4': 'model { }',
    })
    const v1 = await installGit(t, { ref: 'v1', sha: SHA_V1, files: { 'model.c4': billingV1 } })
    await startWithGit(t)
    const { DependencyResolver, ExternalProjects } = t.services.shared.workspace
    expect(DependencyResolver.resolve('a' as ProjectId, 'billing')).toEqual({
      kind: 'external',
      projectId: externalProjectIdOfGitInstance(v1),
    })
    const resolution = ExternalProjects.gitResolution('a' as ProjectId, 'billing')!
    const source = resolution.target.source
    expect(ExternalProjects.gitResolutionFor('a' as ProjectId, 'billing', source)).toBe(resolution)
    expect(ExternalProjects.gitResolutionFor('a' as ProjectId, 'billing', { ...source, ref: 'v2' })).toBeUndefined()
    expect(
      ExternalProjects.gitResolutionFor('a' as ProjectId, 'billing', { ...source, git: 'https://github.com/x/y.git' }),
    ).toBeUndefined()
    expect(ExternalProjects.gitResolutionFor('a' as ProjectId, 'billing', { ...source, path: 'arch' }))
      .toBeUndefined()
    // equivalent forms of the same source match
    expect(
      ExternalProjects.gitResolutionFor('a' as ProjectId, 'billing', {
        git: 'git@github.com:my-org/billing.git',
        ref: 'v1',
        path: './',
      }),
    ).toBe(resolution)
  })

  it('does not sync anything for a workspace with local dependencies only', async ({ create, expect }) => {
    const t = create({ workspace: 'file:///test/workspace' })
    mockFileSystem(t, {
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { shared: '../../shared' } }),
      'file:///test/shared/model.c4': sharedModel,
    })
    const readVersion = mockMethod(t.services.shared.dependencies.Storage, 'readVersion')
    const events = [] as unknown[]
    t.services.shared.dependencies.States.onDidChange(e => events.push(e))
    await startWithGit(t)
    await ProjectsManager_reload(t)
    expect(readVersion).not.toHaveBeenCalled()
    expect(t.services.shared.dependencies.States.all()).toEqual([])
    expect(events).toEqual([])
  })
})
