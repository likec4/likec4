import type * as c4 from '@likec4/core'
import {
  type ViewId,
  isScopedElementView,
  LikeC4Model,
} from '@likec4/core'
import { loggable } from '@likec4/log'
import { deepEqual as eq } from 'fast-equals'
import {
  type Cancellation,
  type DocumentBuilder,
  type LangiumDocuments,
  type URI,
  Disposable,
  DocumentState,
  WorkspaceCache,
} from 'langium'
import prettyMs from 'pretty-ms'
import {
  filter,
  groupBy,
  isNot,
  mapToObj,
  pipe,
  prop,
  values,
} from 'remeda'
import { isLikeC4Builtin } from '../likec4lib'
import { logger as mainLogger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable } from '../utils'
import { assignNavigateTo } from '../view-utils'
import { buildModel } from './builder/buildModel'
import type { LikeC4ModelParser } from './model-parser'

const CACHE_KEY_PARSED_MODEL = 'ParsedLikeC4Model'
const CACHE_KEY_COMPUTED_MODEL = 'ComputedLikeC4Model'

const logger = mainLogger.getChild('ModelBuilder')

type ModelParsedListener = (docs: URI[]) => void

export class LikeC4ModelBuilder extends ADisposable {
  private parser: LikeC4ModelParser
  private listeners: ModelParsedListener[] = []
  private cache: WorkspaceCache<string, unknown>
  private DocumentBuilder: DocumentBuilder
  private LangiumDocuments: LangiumDocuments

  constructor(services: LikeC4Services) {
    super()
    this.parser = services.likec4.ModelParser
    this.cache = services.ValidatedWorkspaceCache
    this.DocumentBuilder = services.shared.workspace.DocumentBuilder
    this.LangiumDocuments = services.shared.workspace.LangiumDocuments

    this.onDispose(
      this.DocumentBuilder.onUpdate((_changed, deleted) => {
        if (deleted.length > 0) {
          this.notifyListeners(deleted)
        }
      }),
    )
    this.onDispose(
      this.DocumentBuilder.onBuildPhase(
        DocumentState.Validated,
        (docs, _cancelToken) => {
          const validated = docs.map(prop('uri')).filter(isNot(isLikeC4Builtin))
          if (validated.length > 0) {
            this.notifyListeners(validated)
          }
        },
      ),
    )
    logger.debug`created`
  }

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   */
  private unsafeSyncParseModel(): c4.ParsedLikeC4Model | null {
    const docs = this.documents()
    if (docs.length === 0) {
      logger.debug('no documents to build model from')
      return null
    }

    const cache = this.cache as WorkspaceCache<string, c4.ParsedLikeC4Model>
    return cache.get(CACHE_KEY_PARSED_MODEL, () => {
      return buildModel(docs)
    })
  }

  public async parseModel(cancelToken?: Cancellation.CancellationToken): Promise<c4.ParsedLikeC4Model | null> {
    const cache = this.cache as WorkspaceCache<string, c4.ParsedLikeC4Model>
    const cached = cache.get(CACHE_KEY_PARSED_MODEL)
    if (cached) {
      logger.debug('parseModel from cache')
      return cached
    }

    if (this.LangiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
      logger.debug('parseModel: waiting for documents to be validated')
      await this.DocumentBuilder.waitUntil(DocumentState.Validated, cancelToken)
      logger.debug('parseModel: documents are validated')
    }
    const t0 = performance.now()
    const result = this.unsafeSyncParseModel()
    logger.debug(`parseModel in ${prettyMs(performance.now() - t0)}`)
    return result
  }

  private previousViews: Record<ViewId, c4.ComputedView> = {}

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   */
  public unsafeSyncBuildModel(): LikeC4Model.Computed {
    const cache = this.cache as WorkspaceCache<string, LikeC4Model.Computed>
    const viewsCache = this.cache as WorkspaceCache<string, c4.ComputedView | null>
    return cache.get(CACHE_KEY_COMPUTED_MODEL, () => {
      const parsed = this.unsafeSyncParseModel()
      if (!parsed) {
        return LikeC4Model.EMPTY
      }

      const {
        views: parsedViews,
        ...model
      } = parsed

      const computeView = LikeC4Model.makeCompute(parsed)

      const allViews = [] as c4.ComputedView[]
      for (const view of values(parsedViews)) {
        const result = computeView(view)
        if (!result.isSuccess) {
          logger.warn(loggable(result.error))
          continue
        }
        allViews.push(result.view)
      }
      assignNavigateTo(allViews)
      const views = mapToObj(allViews, v => {
        const previous = this.previousViews[v.id]
        const view = previous && eq(v, previous) ? previous : v
        viewsCache.set(computedViewKey(v.id), view)
        return [v.id, view] as const
      })
      this.previousViews = { ...views }
      return LikeC4Model.create({
        ...model,
        views,
      })
    })
  }

  public async buildLikeC4Model(
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<LikeC4Model.Computed> {
    const cache = this.cache as WorkspaceCache<string, LikeC4Model.Computed>
    const cached = cache.get(CACHE_KEY_COMPUTED_MODEL)
    if (cached) {
      logger.debug('buildLikeC4Model from cache')
      return cached
    }
    const t0 = performance.now()
    const model = await this.parseModel(cancelToken)
    if (!model) {
      logger.debug('buildLikeC4Model: no model')
      return LikeC4Model.EMPTY
    }
    const result = this.unsafeSyncBuildModel()
    logger.debug(`buildLikeC4Model in ${prettyMs(performance.now() - t0)}`)
    return result
  }

  public async computeView(
    viewId: ViewId,
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<c4.ComputedView | null> {
    const cache = this.cache as WorkspaceCache<string, c4.ComputedView | null>
    const cacheKey = computedViewKey(viewId)
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    }
    const parsed = await this.parseModel(cancelToken)
    if (!parsed) {
      return null
    }
    return cache.get(cacheKey, () => {
      const view = parsed.views[viewId]
      if (!view) {
        logger.warn`computeView: cant find view ${viewId}`
        return null
      }
      logger.debug`computeView: ${viewId}`
      const computeView = LikeC4Model.makeCompute(parsed)
      const result = computeView(view)
      if (!result.isSuccess) {
        logWarnError(result.error)
        return null
      }
      let computedView = result.view

      const allElementViews = pipe(
        parsed.views,
        values(),
        filter(isScopedElementView),
        filter(v => v.id !== viewId),
        groupBy(v => v.viewOf),
      )

      for (const node of computedView.nodes) {
        if (!node.navigateTo) {
          const viewsOfNode = allElementViews[node.id]
          if (viewsOfNode) {
            node.navigateTo = viewsOfNode[0].id
          }
        }
      }

      const previous = this.previousViews[viewId]
      if (previous && eq(computedView, previous)) {
        computedView = previous
      } else {
        this.previousViews[viewId] = computedView
      }

      return computedView
    })
  }

  public onModelParsed(callback: ModelParsedListener): Disposable {
    this.listeners.push(callback)
    return Disposable.create(() => {
      const index = this.listeners.indexOf(callback)
      if (index >= 0) {
        this.listeners.splice(index, 1)
      }
    })
  }

  private documents() {
    return this.parser.documents().toArray()
  }

  private notifyListeners(docs: URI[]) {
    for (const listener of this.listeners) {
      try {
        listener(docs)
      } catch (e) {
        logWarnError(e)
      }
    }
  }
}

function computedViewKey(viewId: string): string {
  return `computed-view-${viewId}`
}
