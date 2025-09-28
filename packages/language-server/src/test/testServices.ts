import type { LikeC4ProjectJsonConfig } from '@likec4/config'
import type { ComputedLikeC4ModelData, ProjectId } from '@likec4/core'
import { type LangiumDocument, DocumentState, TextDocument, UriUtils } from 'langium'
import * as assert from 'node:assert'
import { entries } from 'remeda'
import stripIndent from 'strip-indent'
import type { LiteralUnion } from 'type-fest'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { URI, Utils } from 'vscode-uri'
import type { LikeC4LangiumDocument } from '../ast'
import { NoopFileSystem } from '../filesystem'
import { createLanguageServices } from '../module'

export function createTestServices(options?: {
  workspace?: string
  projectConfig?: Partial<LikeC4ProjectJsonConfig>
}) {
  const workspace = options?.workspace ?? 'file:///test/workspace'
  const projectConfig = options?.projectConfig

  const services = createLanguageServices(NoopFileSystem).likec4
  const metaData = services.LanguageMetaData
  const langiumDocuments = services.shared.workspace.LangiumDocuments
  const documentBuilder = services.shared.workspace.DocumentBuilder
  const modelBuilder = services.likec4.ModelBuilder
  const workspaceUri = URI.parse(workspace)
  const formatter = services.lsp.Formatter
  const workspaceFolder = {
    name: projectConfig?.name || 'test-project',
    uri: workspaceUri.toString(),
  }
  let isInitialized = false
  let documentIndex = 1

  async function initialize() {
    if (isInitialized) return
    isInitialized = true
    services.shared.workspace.ConfigurationProvider.updateConfiguration({
      settings: { likec4: { formatting: { quoteStyle: 'single' } } },
    })
    services.shared.workspace.WorkspaceManager.initialize({
      capabilities: {},
      processId: null,
      rootUri: workspaceFolder.uri,
      workspaceFolders: [workspaceFolder],
    })
    await services.shared.workspace.WorkspaceManager.initializeWorkspace([workspaceFolder])

    // Register project with config if provided...
    if (projectConfig) {
      const projectFolderUri = Utils.resolvePath(workspaceUri, 'src')
      await services.shared.workspace.ProjectsManager.registerProject({
        config: {
          name: projectConfig?.name || 'test-project',
          title: projectConfig?.title || 'Test Project',
          contactPerson: projectConfig?.contactPerson || 'Unknown',
          imageAliases: projectConfig?.imageAliases || {},
          exclude: projectConfig?.exclude || ['node_modules'],
        },
        folderUri: projectFolderUri,
      })
    }
  }

  const addDocument = async (input: string, uri?: string) => {
    await initialize()
    const docUri = Utils.resolvePath(
      workspaceUri,
      './src/',
      uri ?? `${documentIndex++}${metaData.fileExtensions[0]}`,
    )
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(
      stripIndent(input),
      docUri,
    )
    langiumDocuments.addDocument(document)
    return document as LikeC4LangiumDocument
  }

  const removeDocument = async (doc: LangiumDocument | URI) => {
    const uri = doc instanceof URI ? doc : doc.uri
    await documentBuilder.update([], [uri])
  }

  const parse = async (input: string, uri?: string) => {
    const document = await addDocument(input, uri)
    await documentBuilder.build([document], { validation: false })
    return document as LikeC4LangiumDocument
  }

  const validate = async (input: string | LikeC4LangiumDocument, uri?: string) => {
    const document = typeof input === 'string' ? await addDocument(input, uri) : input
    await documentBuilder.build([document], { validation: true })
    const diagnostics = document.diagnostics ?? []
    const warnings = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Warning ? d.message : [])
    const errors = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Error ? d.message : [])
    return {
      document,
      diagnostics,
      warnings,
      errors,
    }
  }

  const format = async (input: string | LikeC4LangiumDocument, uri?: string) => {
    const document = typeof input === 'string' ? await parse(stripIndent(input), uri) : input
    await documentBuilder.build([document], { validation: true })

    const edits = await formatter?.formatDocument(
      document,
      {
        options: { tabSize: 2, insertSpaces: true },
        textDocument: { uri: document.uri.toString() },
      },
    )

    return TextDocument.applyEdits(document.textDocument, edits ?? [])
  }

  const validateAll = async () => {
    const docs = langiumDocuments.all.toArray()
    assert.ok(docs.length > 0, 'no documents to validate')
    await documentBuilder.build(docs, { validation: true })
    const diagnostics = docs.flatMap(doc => doc.diagnostics ?? [])
    const warnings = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Warning ? d.message : [])
    const errors = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Error ? d.message : [])
    return {
      diagnostics,
      errors,
      warnings,
    }
  }

  const buildModel = async (): Promise<ComputedLikeC4ModelData> => {
    if (langiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
      await validateAll()
    }
    const likec4model = await modelBuilder.buildLikeC4Model()
    if (!likec4model) throw new Error('No model found')
    return likec4model.$data
  }

  const buildLikeC4Model = async () => {
    if (langiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
      await validateAll()
    }
    const likec4model = await modelBuilder.buildLikeC4Model()
    if (!likec4model) throw new Error('No model found')
    return likec4model
  }

  /**
   * This will clear all documents
   */
  const resetState = async () => {
    await services.shared.workspace.WorkspaceLock.write(async (cancelToken) => {
      const docs = langiumDocuments.allExcludingBuiltin.toArray().map(doc => doc.uri)
      await documentBuilder.update([], docs, cancelToken)
    })
  }

  return {
    services,
    addDocument,
    removeDocument,
    parse,
    validate,
    validateAll,
    buildModel,
    buildLikeC4Model,
    resetState,
    format,
  }
}

/**
 * @example
 * ```ts
 * const { projects } = await createMultiProjectTestServices({
 *   project1: {
 *     doc1: `...`,
 *     doc2: `...`,
 *   },
 *   project2: {
 *     doc1: `...`,
 *   },
 * })
 * ```
 */
export async function createMultiProjectTestServices<const Projects extends Record<string, Record<string, string>>>(
  data: Projects,
) {
  const workspace = 'file:///test/workspace'
  const {
    services,
    addDocument,
    validateAll,
  } = createTestServices({ workspace })

  const projects = {} as {
    readonly [K in keyof Projects]: {
      readonly [L in keyof Projects[K]]: LikeC4LangiumDocument
    }
  }

  for (const [name, files] of entries(data)) {
    const folderUri = UriUtils.joinPath(URI.parse(workspace), 'src', name)
    await services.shared.workspace.ProjectsManager.registerProject({
      config: {
        name,
        exclude: ['node_modules'],
      },
      folderUri,
    })
    // @ts-ignore
    projects[name] = {} as any

    for (let [docName, content] of entries(files)) {
      const fileName = docName.endsWith('.c4') ? docName : `${docName}.c4`
      // @ts-ignore
      projects[name][docName] = await addDocument(content, `${name}/${fileName}`)
    }
  }

  async function buildLikeC4Model(projectId: LiteralUnion<keyof Projects, string>) {
    if (services.shared.workspace.LangiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
      await validateAll()
    }
    const likec4model = await services.likec4.ModelBuilder.buildLikeC4Model(projectId as ProjectId)
    if (!likec4model) throw new Error('No model found')
    return likec4model
  }

  async function buildModel(projectId: LiteralUnion<keyof Projects, string>) {
    const model = await buildLikeC4Model(projectId)
    return model.$data as ComputedLikeC4ModelData
  }

  return {
    services,
    projects,
    projectsManager: services.shared.workspace.ProjectsManager,
    addDocument: async (uri: string | URI, input: string) => {
      return await addDocument(input, uri.toString())
    },
    /**
     * Add document outside of projects
     */
    addDocumentOutside: async (input: string) => {
      return await addDocument(input)
    },
    validateAll,
    buildModel,
    buildLikeC4Model,
  }
}

export type TestServices = ReturnType<typeof createTestServices>
export type TestParseFn = TestServices['validate']
export type TestValidateFn = TestServices['validate']
