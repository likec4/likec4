import { createLanguageServices } from '../module'
import { EmptyFileSystem } from 'langium'
import { URI } from 'vscode-uri'
import type { LikeC4LangiumDocument } from '../ast'
import { expect } from 'vitest'
import { nanoid } from 'nanoid'

export function createTestLanguageServices() {
  return createLanguageServices(EmptyFileSystem).likec4
}

export function testServices() {
  const services = createLanguageServices(EmptyFileSystem).likec4
  const metaData = services.LanguageMetaData
  const langiumDocuments = services.shared.workspace.LangiumDocuments
  const documentBuilder = services.shared.workspace.DocumentBuilder

  const addDocument = (input: string, uri = `${nanoid()}${metaData.fileExtensions[0]}`) => {
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(input, URI.file(uri))
    langiumDocuments.addDocument(document)
    return document as LikeC4LangiumDocument
  }

  const validate = async () => {
    const docs = langiumDocuments.all.toArray()
    await documentBuilder.build(docs, { validationChecks: 'all' })
    return docs.flatMap(doc => (doc.diagnostics ?? []).filter(e => e.severity === 1)).map(d => d.message)
  }


  // const getModel = async () => {
  //   await validate()
  //   const model = c4xModel.getModel()
  //   if (!model) throw new Error('No model found')
  //   return model
  // }

  return {
    addDocument,
    validate,
    // getModel
  }
}

export async function parseModel(input: string) {
  const { addDocument, validate } = testServices()
  addDocument(input, 'parse-model.c4x')
  return await validate()
}
