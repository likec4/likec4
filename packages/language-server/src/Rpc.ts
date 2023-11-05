import { logError, logger } from './logger'
import type { LikeC4Services } from './module'
import pThrottle from 'p-throttle'

import { nonexhaustive } from '@likec4/core'
import { URI } from 'langium'
import { isLikeC4LangiumDocument } from './ast'
import {
  buildDocuments,
  computeView,
  fetchModel,
  fetchRawModel,
  locate,
  onDidChangeModel,
  rebuild
} from './protocol'

export class Rpc {
  constructor(private services: LikeC4Services) {}

  init() {
    const modelBuilder = this.services.likec4.ModelBuilder
    const modelLocator = this.services.likec4.ModelLocator
    const connection = this.services.shared.lsp.Connection
    if (!connection) {
      logger.info(`[ServerRpc] no connection, not initializing`)
      return
    }
    logger.info(`[ServerRpc] init`)
    const LangiumDocuments = this.services.shared.workspace.LangiumDocuments
    const DocumentBuilder = this.services.shared.workspace.DocumentBuilder

    const notifyClient = pThrottle({
      limit: 4,
      interval: 1000
    })(() => connection.sendNotification(onDidChangeModel, ''))

    modelBuilder.onModelParsed(() => {
      void notifyClient()
    })

    connection.onRequest(fetchModel, async _cancelToken => {
      let model
      try {
        model = modelBuilder.buildModel() ?? null
      } catch (e) {
        model = null
        logError(e)
      }
      return Promise.resolve({ model })
    })

    connection.onRequest(fetchRawModel, async _cancelToken => {
      let rawmodel
      try {
        rawmodel = modelBuilder.buildRawModel() ?? null
      } catch (e) {
        rawmodel = null
        logError(e)
      }
      return Promise.resolve({ rawmodel })
    })

    connection.onRequest(computeView, async ({ viewId }, _cancelToken) => {
      return Promise.resolve({
        view: modelBuilder.computeView(viewId)
      })
    })

    connection.onRequest(rebuild, async cancelToken => {
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

      logger.debug(`[ServerRpc] rebuild all documents: [
        ${changed.map(d => d.toString()).join('\n      ')}
      ]`)
      await DocumentBuilder.update(changed, [], cancelToken)
      return {
        docs: changed.map(d => d.toString())
      }
    })

    connection.onRequest(buildDocuments, async ({ docs }, cancelToken) => {
      if (docs.length === 0) {
        logger.debug(`[ServerRpc] received empty request to rebuild`)
        return
      }
      logger.debug(
        `[ServerRpc] received request to buildDocuments:\n${docs.map(d => '   - ' + d).join('\n')}`
      )
      const changed = docs.map(d => URI.parse(d))
      await DocumentBuilder.update(changed, [], cancelToken)
    })

    connection.onRequest(locate, params => {
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
}
