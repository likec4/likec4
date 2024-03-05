import { DocumentState, EmptyFileSystem } from 'langium'
import * as assert from 'node:assert'
import stripIndent from 'strip-indent'
import { type Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-protocol'
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
  const workspaceFolder = {
    name: 'test',
    uri: workspaceUri.toString()
  }
  let isInitialized = false
  let documentIndex = 1

  const parse = async (input: string, uri?: string) => {
    if (!isInitialized) {
      await services.shared.workspace.WorkspaceLock.write(async (_cancelToken) => {
        if (isInitialized) {
          return
        }
        isInitialized = true
        await services.shared.workspace.WorkspaceManager.initializeWorkspace([workspaceFolder])
        // Workaround to set protected folders property
        Object.assign(services.shared.workspace.WorkspaceManager, {
          folders: [workspaceFolder]
        })
      })
    }
    const docUri = Utils.resolvePath(
      workspaceUri,
      './src/',
      uri ?? `${documentIndex++}${metaData.fileExtensions[0]}`
    )
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(
      stripIndent(input),
      docUri
    )
    langiumDocuments.addDocument(document)
    await services.shared.workspace.WorkspaceLock.write(async (_cancelToken) => {
      await documentBuilder.build([document], { validation: false })
    })
    return document as LikeC4LangiumDocument
  }

  const validate = async (input: string | LikeC4LangiumDocument, uri?: string) => {
    const document = typeof input === 'string' ? await parse(input, uri) : input
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
      errors
    }
  }

  type ValidateAllResult = {
    diagnostics: Diagnostic[]
    errors: string[]
    warnings: string[]
  }
  let previousPromise = Promise.resolve() as Promise<any>
  const validateAll = async () => {
    await services.shared.workspace.WorkspaceLock.write(async (_cancelToken) => {
      const docs = langiumDocuments.all.toArray()
      await documentBuilder.build(docs, { validation: true })
    })
    await documentBuilder.waitUntil(DocumentState.Validated)
    const docs = langiumDocuments.all.toArray()
    assert.ok(docs.length > 0, 'no documents to validate')
    const diagnostics = docs.flatMap(doc => doc.diagnostics ?? [])
    const warnings = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Warning ? d.message : [])
    const errors = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Error ? d.message : [])
    return {
      diagnostics,
      errors,
      warnings
    }
  }

  const buildModel = async () => {
    await validateAll()
    const model = await modelBuilder.buildModel()
    if (!model) throw new Error('No model found')
    return model
  }

  const resetState = async () => {
    await services.shared.workspace.WorkspaceLock.write(async (cancelToken) => {
      const docs = langiumDocuments.all.toArray().map(doc => doc.uri)
      await documentBuilder.update([], docs, cancelToken)
    })
  }

  return {
    services,
    parse,
    validate,
    validateAll,
    buildModel,
    resetState
  }
}

export type TestServices = ReturnType<typeof createTestServices>
export type TestParseFn = TestServices['validate']
export type TestValidateFn = TestServices['validate']
