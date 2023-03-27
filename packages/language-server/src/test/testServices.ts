import { createLanguageServices } from '../module'
import { EmptyFileSystem } from 'langium'
import { URI } from 'vscode-uri'
import type { LikeC4LangiumDocument } from '../ast'

export function createTestServices() {
  const services = createLanguageServices(EmptyFileSystem).likec4
  const metaData = services.LanguageMetaData
  const langiumDocuments = services.shared.workspace.LangiumDocuments
  const documentBuilder = services.shared.workspace.DocumentBuilder

  let documentIndex = 1

  const parse = async (input: string, uri?: string) => {
    uri = uri ?? `${documentIndex++}.${metaData.fileExtensions[0]}`
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(input, URI.file(uri))
    langiumDocuments.addDocument(document)
    await documentBuilder.build([document]);
    return document as LikeC4LangiumDocument
  }

  const validate = async (input: string | LikeC4LangiumDocument) => {
    const document = typeof input === 'string' ? await parse(input) : input
    await documentBuilder.build([document], { validationChecks: 'all' })
    return {
      document,
      diagnostics: document.diagnostics!
    }
  }

  const validateAll = async () => {
    const docs = langiumDocuments.all.toArray()
    await documentBuilder.build(docs, { validationChecks: 'all' })
    return docs.flatMap(doc => (doc.diagnostics ?? []).filter(e => e.severity === 1)).map(d => d.message)
  }

  const buildModel = async () => {
    await validateAll()
    const model = services.likec4.ModelBuilder.buildModel()
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
