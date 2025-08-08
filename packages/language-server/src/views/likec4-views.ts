import type { ComputedView, DiagramView, ProjectId, ViewId } from '@likec4/core'
import { type LayoutTaskParams, type QueueGraphvizLayoter, GraphvizLayouter } from '@likec4/layouts'
import { loggable } from '@likec4/log'
import { type WorkspaceCache } from 'langium'
import { values } from 'remeda'
import type { CancellationToken } from 'vscode-languageserver'
import { logError, logger as rootLogger, logWarnError } from '../logger'
import type { LikeC4ModelBuilder } from '../model/model-builder'
import type { LikeC4Services } from '../module'
import { performanceMark } from '../utils'

export type GraphvizOut = {
  readonly dot: string
  readonly diagram: DiagramView
}

type GraphvizSvgOut = {
  readonly id: ViewId
  readonly dot: string
  readonly svg: string
}

export interface LikeC4Views {
  readonly layouter: GraphvizLayouter
  /**
   * Returns computed views (i.e. views with predicates computed)
   */
  computedViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<ComputedView[]>
  /**
   * Returns all layouted views (i.e. views with layout computed)
   * Result includes dot and diagram
   */
  layoutAllViews(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut[]>
  /**
   * Returns layouted view (i.e. view with layout computed)
   * Result includes dot and diagram
   */
  layoutView(
    viewId: ViewId,
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut | null>
  /**
   * Returns diagrams (i.e. views with layout computed)
   */
  diagrams(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<DiagramView>>
  /**
   * Returns all layouted views as Graphviz output (i.e. views with layout computed)
   */
  viewsAsGraphvizOut(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<GraphvizSvgOut>>
  /**
   * Open view in the preview panel.
   * (works only if running as a vscode extension)
   */
  openView(viewId: ViewId, projectId?: ProjectId | undefined): Promise<void>
}

const viewsLogger = rootLogger.getChild('views')

export class DefaultLikeC4Views implements LikeC4Views {
  private cache = new WeakMap<ComputedView, GraphvizOut>()

  private viewsWithReportedErrors = new Set<ViewId>()
  private ModelBuilder: LikeC4ModelBuilder

  constructor(private services: LikeC4Services) {
    this.ModelBuilder = services.likec4.ModelBuilder
  }

  get layouter(): QueueGraphvizLayoter {
    return this.services.likec4.Layouter
  }

  async computedViews(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<ComputedView[]> {
    const likeC4Model = await this.ModelBuilder.buildLikeC4Model(projectId, cancelToken)
    return values(likeC4Model.$data.views)
  }

  async layoutAllViews(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut[]> {
    const likeC4Model = await this.ModelBuilder.buildLikeC4Model(projectId, cancelToken)
    const views = values(likeC4Model.$data.views)
    if (views.length === 0) {
      return []
    }
    const m0 = performanceMark()
    const logger = projectId ? viewsLogger.getChild(projectId) : viewsLogger
    logger.debug`layoutAll: ${views.length} views`

    const tasks = [] as LayoutTaskParams[]
    const specification = likeC4Model.$data.specification
    const results = [] as GraphvizOut[]
    //
    for (const view of views) {
      let cached = this.cache.get(view)
      if (cached) {
        logger.debug`layout ${view.id} from cache`
        results.push(cached)
        continue
      }
      tasks.push({
        view,
        specification,
      })
    }
    if (tasks.length > 0) {
      await this.layouter.batchLayout({
        batch: tasks,
        onSuccess: (task, result) => {
          this.viewsWithReportedErrors.delete(task.view.id)
          this.cache.set(task.view, result)
          results.push(result)
        },
        onError: (task, error) => {
          logger.warn(`Fail layout view ${task.view.id}`, { error })
        },
      })
    }
    if (results.length !== views.length) {
      logger.warn`layouted ${results.length} of ${views.length} views in ${m0.pretty}`
    } else if (results.length > 0) {
      logger.debug`layouted all ${results.length} views in ${m0.pretty}`
    }

    return results
  }

  async layoutView(
    viewId: ViewId,
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut | null> {
    const model = await this.ModelBuilder.buildLikeC4Model(projectId, cancelToken)
    const view = model.findView(viewId)?.$view
    const logger = projectId ? viewsLogger.getChild(projectId) : viewsLogger
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
      const m0 = performanceMark()
      const result = await this.layouter.layout({
        view,
        specification: model.$data.specification,
      })
      this.viewsWithReportedErrors.delete(viewId)
      this.cache.set(view, result)
      logger.debug(`layout {viewId} ready in ${m0.pretty}`, { viewId })
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
    cancelToken?: CancellationToken,
  ): Promise<Array<DiagramView>> {
    const layouted = await this.layoutAllViews(projectId, cancelToken)
    return layouted.map(l => l.diagram)
  }

  async viewsAsGraphvizOut(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<Array<GraphvizSvgOut>> {
    const KEY = 'All-LayoutedViews-DotWithSvg'
    const cache = this.services.ValidatedWorkspaceCache as WorkspaceCache<string, GraphvizSvgOut[]>
    if (cache.has(KEY)) {
      return await Promise.resolve(cache.get(KEY)!)
    }
    const likeC4Model = await this.ModelBuilder.buildLikeC4Model(projectId, cancelToken)
    const views = values(likeC4Model.$data.views)
    if (views.length === 0) {
      return []
    }
    const tasks = views.map(async view => {
      const { dot, svg } = await this.layouter.svg({
        view,
        specification: likeC4Model.$data.specification,
      })
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

  /**
   * Open a view in the preview panel.
   */
  async openView(viewId: ViewId, projectId: ProjectId): Promise<void> {
    await this.services.Rpc.openView({ viewId, projectId })
  }

  // async overviewGraph(): Promise<OverviewGraph> {
  //   const KEY = 'OverviewGraph'
  //   const cache = this.services.ValidatedWorkspaceCache as WorkspaceCache<string, OverviewGraph>
  //   if (cache.has(KEY)) {
  //     return await Promise.resolve(cache.get(KEY)!)
  //   }
  //   const views = await this.computedViews()
  //   const overviewGraph = await this.layouter.layoutOverviewGraph(views)
  //   cache.set(KEY, overviewGraph)
  //   return overviewGraph
  // }
}
