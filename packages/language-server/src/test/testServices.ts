import { EmptyFileSystem } from 'langium'
import * as assert from 'node:assert'
import stripIndent from 'strip-indent'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
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
      isInitialized = true
      await services.shared.workspace.WorkspaceManager.initializeWorkspace([workspaceFolder])
      // Workaround to set protected folders property
      Object.assign(services.shared.workspace.WorkspaceManager, {
        folders: [workspaceFolder]
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
    await documentBuilder.build([document], { validation: false })
    return document as LikeC4LangiumDocument
  }

  const validate = async (input: string | LikeC4LangiumDocument, uri?: string) => {
    const document = typeof input === 'string' ? await parse(input, uri) : input
    await documentBuilder.build([document], { validation: true })
    const diagnostics = document.diagnostics ?? []
    const warnings = diagnostics.flatMap(d =>
      d.severity === DiagnosticSeverity.Warning ? d.message : []
    )
    const errors = diagnostics.flatMap(d =>
      d.severity === DiagnosticSeverity.Error ? d.message : []
    )
    return {
      document,
      diagnostics,
      warnings,
      errors
    }
  }

  const validateAll = async () => {
    const docs = langiumDocuments.all.toArray()
    assert.ok(docs.length > 0, 'no documents to validate')
    await documentBuilder.build(docs, { validation: true })
    const diagnostics = docs.flatMap(doc => doc.diagnostics ?? [])
    const warnings = diagnostics.flatMap(d =>
      d.severity === DiagnosticSeverity.Warning ? d.message : []
    )
    const errors = diagnostics.flatMap(d =>
      d.severity === DiagnosticSeverity.Error ? d.message : []
    )
    return {
      diagnostics,
      errors,
      warnings
    }
  }

  const buildModel = async () => {
    await validateAll()
    const model = modelBuilder.buildModel()
    if (!model) throw new Error('No model found')
    return model
  }

  return {
    services,
    parse,
    validate,
    validateAll,
    buildModel
  }
}

export type TestServices = ReturnType<typeof createTestServices>
export type TestParseFn = TestServices['validate']
export type TestValidateFn = TestServices['validate']
