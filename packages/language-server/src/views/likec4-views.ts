import type { ComputedView, DiagramView, OverviewGraph, ProjectId, ViewId } from '@likec4/core'
import { GraphvizLayouter } from '@likec4/layouts'
import { loggable } from '@likec4/log'
import { type WorkspaceCache } from 'langium'
import PQueue from 'p-queue'
import prettyMs from 'pretty-ms'
import { values } from 'remeda'
import { CancellationToken } from 'vscode-jsonrpc'
import { logError, logger as rootLogger, logWarnError } from '../logger'
import type { LikeC4ModelBuilder } from '../model/model-builder'
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

export interface LikeC4Views {
  readonly layouter: GraphvizLayouter
  computedViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<ComputedView[]>
  layoutAllViews(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<Array<Readonly<GraphvizOut>>>
  layoutView(
    viewId: ViewId,
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut | null>
  diagrams(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<DiagramView>>
  viewsAsGraphvizOut(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<GraphvizSvgOut>>
  overviewGraph(): Promise<OverviewGraph>
}

export class DefaultLikeC4Views implements LikeC4Views {
  private cache = new WeakMap<ComputedView, GraphvizOut>()

  private viewsWithReportedErrors = new Set<ViewId>()
  private ModelBuilder: LikeC4ModelBuilder
  private queue = new PQueue({ concurrency: 4, timeout: 10_000, throwOnTimeout: true })

  constructor(private services: LikeC4Services) {
    this.ModelBuilder = services.likec4.ModelBuilder
  }

  get layouter(): GraphvizLayouter {
    return this.services.likec4.Layouter
  }

  async computedViews(
    projectId?: ProjectId | undefined,
    cancelToken = CancellationToken.None,
  ): Promise<ComputedView[]> {
    const likeC4Model = await this.ModelBuilder.buildLikeC4Model(projectId, cancelToken)
    return values(likeC4Model.$model.views)
  }

  async layoutAllViews(
    projectId?: ProjectId | undefined,
    cancelToken = CancellationToken.None,
  ): Promise<Array<Readonly<GraphvizOut>>> {
    const views = await this.computedViews(projectId, cancelToken)
    if (views.length === 0) {
      return []
    }
    const logger = rootLogger.getChild(['views', projectId ?? ''])
    logger.debug`layoutAll: ${views.length} views`
    const results = [] as GraphvizOut[]
    const tasks = [] as Promise<GraphvizOut>[]
    for (const view of views) {
      this.viewsWithReportedErrors.delete(view.id)
      tasks.push(
        Promise
          .resolve()
          .then(async () => {
            const result = await this.queue.add(async () => {
              logger.debug`layouting view ${view.id}...`
              return await this.layouter.layout(view)
            })
            if (!result) {
              return Promise.reject(new Error(`Failed to layout view ${view.id}`))
            }
            logger.debug`done layout view ${view.id}`
            this.viewsWithReportedErrors.delete(view.id)
            this.cache.set(view, result)
            return result
          })
          .catch(e => {
            logger.warn(`fail layout view ${view.id}`, { e })
            this.cache.delete(view)
            return Promise.reject(e)
          }),
      )
    }
    for (const task of await Promise.allSettled(tasks)) {
      if (task.status === 'fulfilled') {
        results.push(task.value)
      } else {
        logger.error(loggable(task.reason))
      }
    }
    if (results.length !== views.length) {
      logger.warn`layouted ${results.length} of ${views.length} views`
    } else if (results.length > 0) {
      logger.debug`layouted all ${results.length} views`
    }

    return results
  }

  async layoutView(
    viewId: ViewId,
    projectId?: ProjectId | undefined,
    cancelToken = CancellationToken.None,
  ): Promise<GraphvizOut | null> {
    const model = await this.ModelBuilder.buildLikeC4Model(projectId, cancelToken)
    const view = model.findView(viewId)?.$view
    const logger = rootLogger.getChild(['views', projectId ?? ''])
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
      const result = await this.queue.add(async () => {
        logger.debug`layouting view ${view.id}...`
        return await this.layouter.layout(view)
      })
      if (!result) {
        throw new Error(`Failed to layout view ${viewId}`)
      }
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

  async diagrams(
    projectId?: ProjectId | undefined,
    cancelToken = CancellationToken.None,
  ): Promise<Array<DiagramView>> {
    const layouted = await this.layoutAllViews(projectId, cancelToken)
    return layouted.map(l => l.diagram)
  }

  async viewsAsGraphvizOut(
    projectId?: ProjectId | undefined,
    cancelToken = CancellationToken.None,
  ): Promise<Array<GraphvizSvgOut>> {
    const KEY = 'All-LayoutedViews-DotWithSvg'
    const cache = this.services.ValidatedWorkspaceCache as WorkspaceCache<string, GraphvizSvgOut[]>
    if (cache.has(KEY)) {
      return await Promise.resolve(cache.get(KEY)!)
    }
    const views = await this.computedViews(projectId, cancelToken)
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
