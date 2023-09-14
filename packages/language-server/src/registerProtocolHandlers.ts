import { URI } from 'vscode-uri'
import type { LikeC4Services } from './module'
import { logger, logError } from './logger'
import { Rpc } from './protocol'
import { nonexhaustive } from '@likec4/core'
import { isLikeC4LangiumDocument } from './ast'

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
      logError(e)
    }
    return Promise.resolve({ model })
  })

  connection.onRequest(Rpc.fetchRawModel, async _cancelToken => {
    let rawmodel
    try {
      rawmodel = modelBuilder.buildRawModel() ?? null
    } catch (e) {
      rawmodel = null
      logError(e)
    }
    return Promise.resolve({ rawmodel })
  })

  connection.onRequest(Rpc.computeView, ({ viewId }) => {
    return {
      view: modelBuilder.computeView(viewId)
    }
  })

  connection.onRequest(Rpc.rebuild, async cancelToken => {
    const changed = LangiumDocuments.all
      .map(d => {
        // clean up any computed properties
        if (isLikeC4LangiumDocument(d)) {
          delete d.c4Specification
          delete d.c4Elements
          delete d.c4Relations
          delete d.c4Views
          delete d.c4fqns
        }
        return d.uri
      })
      .toArray()

    logger.debug(`[ProtocolHandlers] rebuild all documents: [
      ${changed.map(d => d.toString()).join('\n      ')}
    ]`)
    await services.shared.workspace.DocumentBuilder.update(changed, [], cancelToken)
    return {
      docs: changed.map(d => d.toString())
    }
  })

  connection.onRequest(Rpc.buildDocuments, async ({ docs }, cancelToken) => {
    if (docs.length === 0) {
      logger.debug(`[ProtocolHandlers] received empty request to rebuild`)
      return
    }
    logger.debug(`[ProtocolHandlers] received request to buildDocuments:
  - ${docs.join('\n  - ')}`)
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
        logError(e)
      }
    }
    if (changed.length !== docs.length) {
      const all = LangiumDocuments.all.map(d => d.uri.toString()).toArray()
      logger.warn(
        `
We have in LangiumDocuments: [
  ${all.join('\n  ')}
]
We rebuild: [
  ${changed.join('\n  ')}
]
`.trim()
      )
    }
    await services.shared.workspace.DocumentBuilder.update(changed, [], cancelToken)
  })

  connection.onRequest(Rpc.locate, params => {
    if ('element' in params) {
      return modelLocator.locateElement(params.element, params.property ?? 'name')
    }
    if ('relation' in params) {
      return modelLocator.locateRelation(params.relation)
    }
    if ('view' in params) {
      return modelLocator.locateView(params.view)
    }
    nonexhaustive(params)
  })
}
