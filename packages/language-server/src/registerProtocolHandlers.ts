import { URI } from 'vscode-uri'
import type { LikeC4Services } from './module'
import { logger } from './logger'
import { Rpc } from './protocol'

export function registerProtocolHandlers(services: LikeC4Services) {
  const connection = services.shared.lsp.Connection
  if (!connection) {
    return
  }
  const modelBuilder = services.likec4.ModelBuilder
  const modelLocator = services.likec4.ModelLocator
  const LangiumDocuments = services.shared.workspace.LangiumDocuments

  connection.onRequest(Rpc.fetchModel, async _cancelToken => {
    let model
    try {
      model = modelBuilder.buildModel() ?? null
    } catch (e) {
      model = null
      logger.error(e)
    }
    return Promise.resolve({model})
  })

  connection.onRequest(Rpc.rebuild, async cancelToken => {
    const changed = LangiumDocuments.all.map(d => d.uri).toArray()
    logger.debug(`Rebuild all documents: [
      ${changed.map(d => d.toString()).join('\n      ')}
    ]`)
    await services.shared.workspace.DocumentBuilder.update(changed, [], cancelToken)
    return {
      docs: changed.map(d => d.toString())
    }
  })

  connection.onRequest(Rpc.buildDocuments, async ({ docs }, cancelToken) => {
    if (docs.length === 0) {
      logger.debug(`Received empty request to rebuild`)
      return
    }
    logger.debug(`Received request to rebuild: [
      ${docs.join('\n      ')}
    ]`)
    const changed = [] as URI[]
    for (const d of docs) {
      try {
        const uri = URI.parse(d)
        if (LangiumDocuments.hasDocument(uri)) {
          changed.push(uri)
        } else {
          logger.warn(`LangiumDocuments does not have document: ${d}`)
          LangiumDocuments.getOrCreateDocument(uri)
        }
      } catch (e) {
        logger.error(e)
      }
    }
    if (changed.length !== docs.length) {
      const all = LangiumDocuments.all.map(d => d.uri.toString()).toArray()
      logger.warn(`
We have in LangiumDocuments: [
  ${all.join('\n  ')}
]
We rebuild: [
  ${changed.join('\n  ')}
]
`.trim())
    }
    await services.shared.workspace.DocumentBuilder.update(changed, [], cancelToken)
  })

  connection.onRequest(Rpc.locateElement, async ({ element, property }, _cancelToken) => {
    try {
      return Promise.resolve(modelLocator.locateElement(element, property ?? 'name'))
    } catch (e) {
      return Promise.reject(e) as never
    }
  })

  connection.onRequest(Rpc.locateRelation, ({ id }, _cancelToken) => {
    try {
      return Promise.resolve(modelLocator.locateRelation(id))
    } catch (e) {
      return Promise.reject(e) as never
    }
  })

  connection.onRequest(Rpc.locateView, ({ id }, _cancelToken) => {
    try {
      return Promise.resolve(modelLocator.locateView(id))
    } catch (e) {
      return Promise.reject(e) as never
    }
  })
}
