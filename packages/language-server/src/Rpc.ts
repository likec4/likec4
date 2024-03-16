import debounceFunction from 'debounce-fn'
import { logError, logger } from './logger'
import type { LikeC4Services } from './module'

import { nonexhaustive } from '@likec4/core'
import { URI, UriUtils } from 'langium'
import { isLikeC4LangiumDocument } from './ast'
import {
  buildDocuments,
  changeView,
  computeView,
  fetchModel,
  fetchRawModel,
  locate,
  onDidChangeModel
} from './protocol'

export class Rpc {
  constructor(private services: LikeC4Services) {}

  init() {
    const modelBuilder = this.services.likec4.ModelBuilder
    const modelLocator = this.services.likec4.ModelLocator
    const modelEditor = this.services.likec4.ModelChanges
    const connection = this.services.shared.lsp.Connection
    if (!connection) {
      logger.info(`[ServerRpc] no connection, not initializing`)
      return
    }
    logger.info(`[ServerRpc] init`)
    const LangiumDocuments = this.services.shared.workspace.LangiumDocuments
    const DocumentBuilder = this.services.shared.workspace.DocumentBuilder

    modelBuilder.onModelParsed(
      debounceFunction(
        () => void connection.sendNotification(onDidChangeModel, '').catch(logError),
        {
          before: true,
          after: true,
          wait: 250,
          maxWait: 1000
        }
      )
    )

    connection.onRequest(fetchModel, async cancelToken => {
      const model = await modelBuilder.buildModel(cancelToken)
      return { model }
    })

    connection.onRequest(fetchRawModel, async cancelToken => {
      const rawmodel = await modelBuilder.buildRawModel(cancelToken)
      return { rawmodel }
    })

    connection.onRequest(computeView, async ({ viewId }, cancelToken) => {
      const view = await modelBuilder.computeView(viewId, cancelToken)
      return { view }
    })

    connection.onRequest(buildDocuments, async ({ docs }, cancelToken) => {
      const changed = docs.map(d => URI.parse(d))
      const notChanged = (uri: URI) => changed.every(c => !UriUtils.equals(c, uri))
      const deleted = LangiumDocuments.all
        .filter(d => isLikeC4LangiumDocument(d) && notChanged(d.uri))
        .map(d => d.uri)
        .toArray()
      logger.debug(
        `[ServerRpc] received request to build:
  changed (total ${changed.length}):${docs.map(d => '\n    - ' + d).join('')}
  deleted (total ${deleted.length}):${deleted.map(d => '\n    - ' + d.toString()).join('\n')}`
      )
      await DocumentBuilder.update(changed, deleted, cancelToken)
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

    connection.onRequest(changeView, async (request, _cancelToken) => {
      return await modelEditor.applyChange(request)
    })
  }
}
