import { createLanguageServices } from '../module'
import { EmptyFileSystem } from 'langium'
import { URI, Utils } from 'vscode-uri'
import type { LikeC4LangiumDocument } from '../ast'
import stripIndent from 'strip-indent'

export function createTestServices(workspace = 'file:///test/workspace') {
  const services = createLanguageServices(EmptyFileSystem).likec4
  const metaData = services.LanguageMetaData
  const langiumDocuments = services.shared.workspace.LangiumDocuments
  const documentBuilder = services.shared.workspace.DocumentBuilder
  const modelBuilder = services.likec4.ModelBuilder
  const workspaceUri = URI.parse(workspace)
  const initPromise = services.shared.workspace.WorkspaceManager.initializeWorkspace([
    {
      name: 'test',
      uri: workspaceUri.toString()
    }
  ])

  let documentIndex = 1

  const parse = async (input: string, uri?: string) => {
    await initPromise
    const docUri = Utils.joinPath(
      workspaceUri,
      '/src/',
      uri ?? `${documentIndex++}${metaData.fileExtensions[0]}`
    )
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(
      stripIndent(input),
      docUri
    )
    langiumDocuments.addDocument(document)
    await documentBuilder.build([document], { validationChecks: 'none' })
    return document as LikeC4LangiumDocument
  }

  const validate = async (input: string | LikeC4LangiumDocument, uri?: string) => {
    await initPromise
    const document = typeof input === 'string' ? await parse(input, uri) : input
    await documentBuilder.build([document], { validationChecks: 'all' })
    const diagnostics = document.diagnostics ?? []
    const errors = diagnostics.map(d => d.message)
    return {
      document,
      diagnostics,
      errors
    }
  }

  const validateAll = async () => {
    await initPromise
    const docs = langiumDocuments.all.toArray()
    await documentBuilder.build(docs, { validationChecks: 'all' })
    const diagnostics = docs.flatMap(doc => doc.diagnostics ?? [])
    const errors = diagnostics.map(d => d.message)
    return {
      diagnostics,
      errors
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
