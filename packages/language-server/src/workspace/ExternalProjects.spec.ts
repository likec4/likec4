import { isLikeC4Config, LikeC4ProjectConfigOps } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import JSON5 from 'json5'
import { type LangiumDocument, DocumentState, URI, UriUtils } from 'langium'
import { describe, vi } from 'vitest'
import type { WorkspaceFolder } from 'vscode-languageserver'
import type { FileNode } from '../filesystem'
import { mockMethod, test as it } from '../test'
import type { createTestServices } from '../test/testServices'
import { externalProjectIdOfFolder } from './ExternalProjects'

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
  mockMethod(fs, 'readFile').mockImplementation(async uri => files.get(norm(uri)) ?? '')
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
  return { write, remove, loadProjectConfig }
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
      'file:///test/shared/model.c4',
      'file:///test/shared/nested/more.likec4',
    ])

    // documents are loaded into the workspace and owned by the instance
    const sharedDoc = LangiumDocuments.getDocument(URI.parse('file:///test/shared/model.c4'))!
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
      'file:///test/shared/model.c4',
      'file:///test/shared/nested/more.likec4',
    ])
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
      .filter(d => d.uri.toString().startsWith('file:///test/shared/'))
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
    await startWorkspace(t, 'file:///test/workspace')

    const { LangiumDocuments } = t.services.shared.workspace
    const doc = (uri: string) => LangiumDocuments.getDocument(URI.parse(uri)) as LangiumDocument
    // Same content in the workspace has errors
    const workspaceDoc = doc('file:///test/workspace/a/broken.c4')
    expect(workspaceDoc.diagnostics?.length).toBeGreaterThan(0)

    const externalDoc = doc('file:///test/shared/broken.c4')
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
    expect([...instance.files.keys()]).toEqual(['file:///test/shared/model.c4'])
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
    const sharedDocUri = URI.parse('file:///test/shared/model.c4')
    expect(ExternalProjects.has('#file:///test/shared')).toBe(true)
    expect(LangiumDocuments.hasDocument(sharedDocUri)).toBe(true)

    // switch to another dependency
    fs.write({
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a', dependencies: { other: '../../other' } }),
    })
    await ProjectsManager.reloadProjects()

    expect(ExternalProjects.has('#file:///test/shared')).toBe(false)
    expect(ExternalProjects.ownerProjectId(sharedDocUri)).toBeUndefined()
    expect(LangiumDocuments.hasDocument(sharedDocUri)).toBe(false)
    expect(ExternalProjects.all().map(p => p.id)).toEqual(['#file:///test/other'])
    const otherDoc = LangiumDocuments.getDocument(URI.parse('file:///test/other/model.c4'))!
    expect(otherDoc.state).toBe(DocumentState.Validated)
    expect(t.services.likec4.FqnIndex.elements('#file:///test/other' as ProjectId).map(e => e.id).toArray())
      .toEqual(['other'])

    // remove the dependencies section
    fs.write({
      'file:///test/workspace/a/likec4.config.json': config({ name: 'a' }),
    })
    await ProjectsManager.reloadProjects()
    expect(ExternalProjects.all()).toEqual([])
    expect(LangiumDocuments.hasDocument(URI.parse('file:///test/other/model.c4'))).toBe(false)
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

    const { ExternalProjects, LangiumDocuments } = t.services.shared.workspace
    expect(ExternalProjects.all()).toHaveLength(1)
    expect(ExternalProjects.documents(id).map(String).sort()).toEqual([
      'file:///test/shared/added.c4',
      'file:///test/shared/model.c4',
    ])
    expect(LangiumDocuments.hasDocument(URI.parse('file:///test/shared/removed.c4'))).toBe(false)
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

    await vi.waitFor(() => {
      expect(ExternalProjects.has('#file:///test/shared')).toBe(true)
      const doc = LangiumDocuments.getDocument(URI.parse('file:///test/shared/model.c4'))
      expect(doc?.state).toBe(DocumentState.Validated)
    })
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
        'file:///C:/work/shared/model.c4',
        'file:///c:/work/shared/model.c4',
        'file:///C%3A/work/shared/model.c4',
        URI.file('C:/work/shared/model.c4'),
      ]
    ) {
      expect(ProjectsLookup.ownerProjectId(uri)).toBe(shared)
    }
    expect(ProjectsLookup.ownerProjectId('file:///C:/work/shared-other/model.c4')).toBe(other)
    expect(ExternalProjects.findByFolder('file:///C:/work/shared')?.id).toBe(shared)
    expect(ExternalProjects.findByFolder(URI.parse('file:///c%3A/work/shared-other/'))?.id).toBe(other)
    expect(ProjectsLookup.isIncluded(shared, 'file:///C:/work/shared-other/model.c4')).toBe(false)
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
    expect(ProjectsLookup.ownerProjectId('C:\\work\\shared\\model.c4')).toBe('#file:///c%3A/work/shared')
    expect(ExternalProjects.findByFolder('c:\\work\\shared')?.id).toBe('#file:///c%3A/work/shared')
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
    expect(ExternalProjects.all()).toEqual([])
  })
})
