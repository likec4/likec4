import type { URI } from 'vscode-uri'
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
    return Promise.resolve({
      model: model ?? null
    })
  })

  connection.onRequest(Rpc.buildDocuments, async ({docs}, cancelToken) => {
    const changed = [] as URI[]
    for (const d of docs) {
      const uri = d as unknown as URI
      if (LangiumDocuments.hasDocument(uri)) {
        changed.push(uri)
      } else {
        logger.error(`LangiumDocuments does not have document: ${uri.toString()}`)
      }
    }
    logger.debug(`Received request to rebuild: [
      ${changed.map(d => d.toString()).join('\n      ')}
    ]`)
    await services.shared.workspace.DocumentBuilder.update(changed, [], cancelToken)
  })

  connection.onRequest(Rpc.locateElement, async ({element, property}, _cancelToken) => {
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
