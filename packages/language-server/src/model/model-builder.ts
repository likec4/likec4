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
  type URI,
  Disposable,
  DocumentState,
  WorkspaceCache,
} from 'langium'
import {
  filter,
  groupBy,
  mapToObj,
  pipe,
  values,
} from 'remeda'
import { logger as mainLogger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable } from '../utils'
import { assignNavigateTo } from '../view-utils'
import { buildModel } from './builder/buildModel'
import type { LikeC4ModelParser } from './model-parser'

const CACHE_KEY_PARSED_MODEL = 'ParsedLikeC4Model'
const CACHE_KEY_COMPUTED_MODEL = 'ComputedLikeC4Model'

const logger = mainLogger.getChild('model-builder')

type ModelParsedListener = (docs: URI[]) => void

type ParseModelResult = {
  model: c4.ParsedLikeC4Model
  computeView: (view: c4.LikeC4View) => c4.ComputeViewResult
}

export class LikeC4ModelBuilder extends ADisposable {
  private parser: LikeC4ModelParser
  private listeners: ModelParsedListener[] = []
  private cache: WorkspaceCache<string, unknown>
  private DocumentBuilder: DocumentBuilder

  constructor(services: LikeC4Services) {
    super()
    this.parser = services.likec4.ModelParser
    this.cache = services.ValidatedWorkspaceCache
    this.DocumentBuilder = services.shared.workspace.DocumentBuilder

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
          logger.debug('onValidated ({docslength} docs)', { docslength: docs.length })
          this.notifyListeners(docs.map(d => d.uri))
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
  private unsafeSyncParseModel(): ParseModelResult | null {
    const docs = this.documents()
    if (docs.length === 0) {
      logger.debug('no documents to build model from')
      return null
    }

    const cache = this.cache as WorkspaceCache<string, ParseModelResult>
    return cache.get(CACHE_KEY_PARSED_MODEL, () => {
      logger.debug('unsafeSyncParseModel ({docslength} docs)', { docslength: docs.length })
      const model = buildModel(docs)
      const computeView = LikeC4Model.makeCompute(model)
      return { model, computeView }
    })
  }

  public async parseModel(cancelToken?: Cancellation.CancellationToken): Promise<ParseModelResult | null> {
    const cache = this.cache as WorkspaceCache<string, ParseModelResult>
    const cached = cache.get(CACHE_KEY_PARSED_MODEL)
    if (cached) {
      return await Promise.resolve(cached)
    }
    await this.DocumentBuilder.waitUntil(DocumentState.Validated, cancelToken)
    return this.unsafeSyncParseModel()
  }

  private previousViews: Record<ViewId, c4.ComputedView> = {}

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   */
  public unsafeSyncBuildModel(): LikeC4Model.Computed {
    const parsed = this.unsafeSyncParseModel()
    if (!parsed) {
      return LikeC4Model.EMPTY
    }
    const cache = this.cache as WorkspaceCache<string, LikeC4Model.Computed>
    const viewsCache = this.cache as WorkspaceCache<string, c4.ComputedView | null>
    return cache.get(CACHE_KEY_COMPUTED_MODEL, () => {
      const {
        model: {
          views: parsedViews,
          ...model
        },
        computeView,
      } = parsed
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
      return await Promise.resolve(cached)
    }
    const model = await this.parseModel(cancelToken)
    if (!model) {
      return LikeC4Model.EMPTY
    }
    return this.unsafeSyncBuildModel()
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
      const view = parsed.model.views[viewId]
      if (!view) {
        logger.warn(`[ModelBuilder] Cannot find view ${viewId}`)
        return null
      }
      const result = parsed.computeView(view)
      if (!result.isSuccess) {
        logWarnError(result.error)
        return null
      }
      let computedView = result.view

      const allElementViews = pipe(
        parsed.model.views,
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
