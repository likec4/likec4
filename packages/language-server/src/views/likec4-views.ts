import type { ComputedView, DiagramView, OverviewGraph, ViewId } from '@likec4/core'
import { GraphvizLayouter } from '@likec4/layouts'
import { loggable } from '@likec4/log'
import { type Cancellation, type WorkspaceCache } from 'langium'
import prettyMs from 'pretty-ms'
import { values } from 'remeda'
import { logError, logger as rootLogger, logWarnError } from '../logger'
import { LikeC4ModelBuilder } from '../model/model-builder'
import type { LikeC4Services } from '../module'

export type GraphvizOut = {
  dot: string
  diagram: DiagramView
}

type GraphvizSvgOut = {
  id: ViewId
  dot: string
  svg: string
}

const logger = rootLogger.getChild('Views')

export class LikeC4Views {
  private cache = new WeakMap<ComputedView, GraphvizOut>()

  private viewsWithReportedErrors = new Set<ViewId>()
  private ModelBuilder: LikeC4ModelBuilder

  constructor(private services: LikeC4Services) {
    this.ModelBuilder = services.likec4.ModelBuilder
  }

  get layouter(): GraphvizLayouter {
    return this.services.likec4.Layouter
  }

  async computedViews(cancelToken?: Cancellation.CancellationToken): Promise<ComputedView[]> {
    const likeC4Model = await this.ModelBuilder.buildLikeC4Model(cancelToken)
    return values(likeC4Model.$model.views)
  }

  async layoutAllViews(cancelToken?: Cancellation.CancellationToken): Promise<Array<Readonly<GraphvizOut>>> {
    const views = await this.computedViews(cancelToken)
    if (views.length === 0) {
      return []
    }
    logger.debug`layoutAll: ${views.length} views`
    const results = [] as GraphvizOut[]
    const tasks = [] as Promise<GraphvizOut>[]
    for (const view of views) {
      this.viewsWithReportedErrors.delete(view.id)
      tasks.push(
        this.layouter.layout(view)
          .then(result => {
            this.viewsWithReportedErrors.delete(view.id)
            this.cache.set(view, result)
            return result
          })
          .catch(e => {
            this.cache.delete(view)
            logWarnError(e)
            return Promise.reject(e)
          }),
      )
    }
    for (const task of await Promise.allSettled(tasks)) {
      if (task.status === 'fulfilled') {
        results.push(task.value)
      }
    }
    if (results.length !== views.length) {
      logger.warn`layouted ${results.length} of ${views.length} views`
    } else if (results.length > 0) {
      logger.debug`layouted all ${results.length} views`
    }

    return results
  }

  async layoutView(viewId: ViewId, cancelToken?: Cancellation.CancellationToken): Promise<GraphvizOut | null> {
    const model = await this.ModelBuilder.buildLikeC4Model(cancelToken)
    const view = model.findView(viewId)?.$view
    if (!view) {
      logger.warn`layoutView ${viewId} not found`
      return null
    }
    let cached = this.cache.get(view)
    if (cached) {
      logger.debug`layout ${viewId} from cache`
      return await Promise.resolve(cached)
    }
    try {
      const start = performance.now()
      const result = await this.layouter.layout(view)
      this.viewsWithReportedErrors.delete(viewId)
      this.cache.set(view, result)
      logger.debug(`layout {viewId} ready in ${prettyMs(performance.now() - start)}`, { viewId })
      return result
    } catch (e) {
      if (!this.viewsWithReportedErrors.has(viewId)) {
        const errMessage = loggable(e)
        this.services.shared.lsp.Connection?.window.showErrorMessage(`LikeC4: ${errMessage}`)
        this.viewsWithReportedErrors.add(viewId)
        logError(e)
      }
      return Promise.reject(e)
    }
  }

  async diagrams(): Promise<Array<DiagramView>> {
    const layouted = await this.layoutAllViews()
    return layouted.map(l => l.diagram)
  }

  async viewsAsGraphvizOut(): Promise<Array<GraphvizSvgOut>> {
    const KEY = 'All-LayoutedViews-DotWithSvg'
    const cache = this.services.ValidatedWorkspaceCache as WorkspaceCache<string, GraphvizSvgOut[]>
    if (cache.has(KEY)) {
      return await Promise.resolve(cache.get(KEY)!)
    }
    const views = await this.computedViews()
    const tasks = views.map(async view => {
      const { dot, svg } = await this.layouter.svg(view)
      return {
        id: view.id,
        dot,
        svg,
      }
    })
    const succeed = [] as GraphvizSvgOut[]
    const settledResult = await Promise.allSettled(tasks)
    for (const result of settledResult) {
      if (result.status === 'fulfilled') {
        succeed.push(result.value)
      } else {
        logWarnError(result.reason)
      }
    }
    cache.set(KEY, succeed)
    return succeed
  }

  async overviewGraph(): Promise<OverviewGraph> {
    const KEY = 'OverviewGraph'
    const cache = this.services.ValidatedWorkspaceCache as WorkspaceCache<string, OverviewGraph>
    if (cache.has(KEY)) {
      return await Promise.resolve(cache.get(KEY)!)
    }
    const views = await this.computedViews()
    const overviewGraph = await this.layouter.layoutOverviewGraph(views)
    cache.set(KEY, overviewGraph)
    return overviewGraph
  }
}
