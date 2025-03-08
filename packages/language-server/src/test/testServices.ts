import type { ComputedLikeC4ModelData, ProjectId } from '@likec4/core'
import { DocumentState, EmptyFileSystem, TextDocument, UriUtils } from 'langium'
import * as assert from 'node:assert'
import { entries } from 'remeda'
import stripIndent from 'strip-indent'
import { type Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types'
import { URI, Utils } from 'vscode-uri'
import type { LikeC4LangiumDocument } from '../ast'
import { createLanguageServices } from '../module'

export function createTestServices(workspace = 'file:///test/workspace') {
  const services = createLanguageServices(EmptyFileSystem).likec4
  const metaData = services.LanguageMetaData
  const langiumDocuments = services.shared.workspace.LangiumDocuments
  const documentBuilder = services.shared.workspace.DocumentBuilder
  const modelBuilder = services.likec4.ModelBuilder
  const workspaceUri = URI.parse(workspace)
  const formatter = services.lsp.Formatter
  const workspaceFolder = {
    name: 'test',
    uri: workspaceUri.toString(),
  }
  let isInitialized = false
  let documentIndex = 1

  async function initialize() {
    if (isInitialized) return
    isInitialized = true
    await services.shared.workspace.WorkspaceLock.write(async (_cancelToken) => {
      services.shared.workspace.WorkspaceManager.initialize({
        capabilities: {},
        processId: null,
        rootUri: workspaceFolder.uri,
        workspaceFolders: [workspaceFolder],
      })
      await services.shared.workspace.WorkspaceManager.initializeWorkspace([workspaceFolder])
    })
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

  const parse = async (input: string, uri?: string) => {
    const document = await addDocument(input, uri)
    await services.shared.workspace.WorkspaceLock.write(async (_cancelToken) => {
      await documentBuilder.build([document], { validation: false })
    })
    return document as LikeC4LangiumDocument
  }

  const validate = async (input: string | LikeC4LangiumDocument, uri?: string) => {
    const document = typeof input === 'string' ? await addDocument(input, uri) : input
    await services.shared.workspace.WorkspaceLock.write(async (_cancelToken) => {
      await documentBuilder.build([document], { validation: true })
    })
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
    const document = typeof input === 'string' ? await parse(input, uri) : input
    await services.shared.workspace.WorkspaceLock.write(async (_cancelToken) => {
      await documentBuilder.build([document], { validation: true })
    })

    const edits = await formatter?.formatDocument(
      document,
      {
        options: { tabSize: 2, insertSpaces: true },
        textDocument: { uri: document.uri.toString() },
      },
    )

    return TextDocument.applyEdits(document.textDocument, edits ?? [])
  }

  type ValidateAllResult = {
    diagnostics: Diagnostic[]
    errors: string[]
    warnings: string[]
  }

  const validateAll = async () => {
    const docs = langiumDocuments.all.toArray()
    assert.ok(docs.length > 0, 'no documents to validate')
    await services.shared.workspace.WorkspaceLock.write(async (cancelToken) => {
      await documentBuilder.build(docs, { validation: true }, cancelToken)
    })
    const diagnostics = docs.flatMap(doc => doc.diagnostics ?? [])
    const warnings = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Warning ? d.message : [])
    const errors = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Error ? d.message : [])
    return {
      diagnostics,
      errors,
      warnings,
    }
  }

  const buildModel = async () => {
    if (langiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
      await validateAll()
    }
    const likec4model = await modelBuilder.buildLikeC4Model()
    if (!likec4model) throw new Error('No model found')
    return likec4model.$model as ComputedLikeC4ModelData
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
      const docs = langiumDocuments.all.toArray().map(doc => doc.uri)
      await documentBuilder.update([], docs, cancelToken)
    })
  }

  return {
    services,
    addDocument,
    parse,
    validate,
    validateAll,
    buildModel,
    buildLikeC4Model,
    resetState,
    format,
  }
}

export async function createMultiProjectTestServices<const Projects extends Record<string, Record<string, string>>>(
  data: Projects,
) {
  const workspace = 'file:///test/workspace'
  const {
    services,
    addDocument,
    validateAll,
  } = createTestServices(workspace)

  const projects = {} as {
    readonly [K in keyof Projects]: {
      readonly [L in keyof Projects[K]]: LikeC4LangiumDocument
    }
  }

  for (const [name, files] of entries(data)) {
    const folder = UriUtils.joinPath(URI.parse(workspace), 'src', name)
    const config = UriUtils.joinPath(folder, 'likec4.config.json')
    services.shared.workspace.ProjectsManager.registerProject(config)
    // @ts-ignore
    projects[name] = {} as any

    for (let [docName, content] of entries(files)) {
      const fileName = docName.endsWith('.c4') ? docName : `${docName}.c4`
      // @ts-ignore
      projects[name][docName] = await addDocument(content, `${name}/${fileName}`)
    }
  }

  async function buildLikeC4Model(projectId: keyof Projects) {
    if (services.shared.workspace.LangiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
      await validateAll()
    }
    const likec4model = await services.likec4.ModelBuilder.buildLikeC4Model(projectId as ProjectId)
    if (!likec4model) throw new Error('No model found')
    return likec4model
  }

  async function buildModel(projectId: keyof Projects) {
    const model = await buildLikeC4Model(projectId)
    return model.$model as ComputedLikeC4ModelData
  }

  return {
    projects,
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
