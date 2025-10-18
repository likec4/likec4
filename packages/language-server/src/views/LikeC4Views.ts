import type { ComputedView, DiagramView, LayoutedView, ProjectId, ViewId, ViewManualLayoutSnapshot } from '@likec4/core'
import { type LikeC4Model, applyLayoutDriftReasons, applyManualLayout } from '@likec4/core/model'
import { type LayoutResult, type LayoutTaskParams, type QueueGraphvizLayoter, GraphvizLayouter } from '@likec4/layouts'
import { loggable } from '@likec4/log'
import { type WorkspaceCache, interruptAndCheck } from 'langium'
import { values } from 'remeda'
import type { CancellationToken } from 'vscode-languageserver'
import { logger as rootLogger, logWarnError } from '../logger'
import type { LikeC4ModelBuilder } from '../model/model-builder'
import type { LikeC4Services } from '../module'
import { performanceMark } from '../utils'

export type GraphvizOut = {
  readonly dot: string
  readonly diagram: LayoutedView
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
   * Returns all layouted views (without manual layout)
   */
  layoutAllViews(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut[]>
  /**
   * Layouts a view (from sources, i.e. without manual layout)
   * If view not found in model, but there is a snapshot - it will be returned (with empty DOT)
   */
  layoutView(
    viewId: ViewId,
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut | null>
  /**
   * Returns diagrams.
   * If diagram has manual layout, it will be used.
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

  /**
   * Set of viewIds with reported errors
   * value is `${projectId}-${viewId}`
   */
  private viewsWithReportedErrors = new Set<string>()

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
    const likeC4Model = await this.ModelBuilder.computeModel(projectId, cancelToken)
    return values(likeC4Model.$data.views)
  }

  private async _layoutAllViews(
    likeC4Model: LikeC4Model.Computed,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut[]> {
    const views = values(likeC4Model.$data.views)
    if (views.length === 0) {
      return []
    }
    const m0 = performanceMark()
    const projectId = likeC4Model.project.id
    const logger = viewsLogger.getChild(projectId)
    logger.debug`layoutAll: ${views.length} views`

    const tasks = [] as LayoutTaskParams[]
    const styles = likeC4Model.$styles
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
        styles,
      })
    }
    if (tasks.length > 0) {
      await this.layouter.batchLayout({
        batch: tasks,
        cancelToken,
        onSuccess: (task, result) => {
          results.push(
            this.viewSucceed(task.view, likeC4Model, result),
          )
        },
        onError: (task, error) => {
          logger.warn(`Fail layout view ${task.view.id}`, { error })
        },
      })
    }
    if (cancelToken && cancelToken.isCancellationRequested) {
      await interruptAndCheck(cancelToken)
    }
    if (results.length !== views.length) {
      logger.warn`layouted ${results.length} of ${views.length} views in ${m0.pretty}`
    } else if (results.length > 0) {
      logger.debug`layouted all ${results.length} views in ${m0.pretty}`
    }

    return results
  }
  async layoutAllViews(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut[]> {
    const likeC4Model = await this.ModelBuilder.computeModel(projectId, cancelToken)
    return await this._layoutAllViews(likeC4Model, cancelToken)
  }

  async layoutView(
    viewId: ViewId,
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut | null> {
    const model = await this.ModelBuilder.computeModel(projectId, cancelToken)
    const view = model.findView(viewId)?.$view
    projectId = model.project.id
    const logger = viewsLogger.getChild(projectId)
    if (!view) {
      logger.warn`layoutView ${viewId} not found`
      const project = this.services.shared.workspace.ProjectsManager.getProject(projectId)
      const manualLayouts = await this.services.likec4.ManualLayouts.read(project)
      const snapshot = manualLayouts?.[viewId]
      if (snapshot) {
        logger.debug`found manual layout for ${viewId}`
        return {
          diagram: {
            ...snapshot,
            drifts: ['not-exists'],
          },
          dot: '# manual layout',
        }
      }
      return null
    }
    let cached = this.cache.get(view)
    if (cached) {
      logger.debug`layout ${viewId} from cache`
      return await Promise.resolve().then(() => cached)
    }
    try {
      const m0 = performanceMark()
      const result = await this.layouter.layout({
        view,
        styles: model.$styles,
      })
      logger.debug(`layout {viewId} ready in ${m0.pretty}`, { viewId })
      return this.viewSucceed(view, model, result)
    } catch (e) {
      const errMessage = loggable(e)
      logger.warn(errMessage)
      this.reportViewError(view, projectId, errMessage)
      return Promise.reject(e)
    }
  }

  async diagrams(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<Array<LayoutedView>> {
    const likeC4Model = await this.ModelBuilder.computeModel(projectId, cancelToken)
    const layouted = await this._layoutAllViews(likeC4Model, cancelToken)

    return layouted.map(({ diagram }) => {
      const manualLayout = likeC4Model.$data.manualLayouts?.[diagram.id]
      if (manualLayout) {
        return applyManualLayout(diagram, manualLayout)
      }
      return diagram
    })
  }

  async viewsAsGraphvizOut(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<Array<GraphvizSvgOut>> {
    const KEY = 'All-LayoutedViews-DotWithSvg'
    const cache = this.services.shared.workspace.Cache as WorkspaceCache<string, GraphvizSvgOut[]>
    if (cache.has(KEY)) {
      return await Promise.resolve(cache.get(KEY)!)
    }
    const likeC4Model = await this.ModelBuilder.computeModel(projectId, cancelToken)
    const views = values(likeC4Model.$data.views)
    if (views.length === 0) {
      return []
    }
    const tasks = views.map(async view => {
      const { dot, svg } = await this.layouter.svg({
        view,
        styles: likeC4Model.$styles,
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

  private reportViewError(view: ComputedView, projectId: ProjectId, error: string): void {
    const key = `${projectId}-${view.id}`
    if (!this.viewsWithReportedErrors.has(key)) {
      this.services.shared.lsp.Connection?.window.showErrorMessage(`LikeC4: ${error}`)
      this.viewsWithReportedErrors.add(key)
    }
  }

  private viewSucceed(
    view: ComputedView,
    likec4model: LikeC4Model.Computed,
    result: LayoutResult,
  ): LayoutResult & { snapshot?: ViewManualLayoutSnapshot } {
    const projectId = likec4model.project.id
    const key = `${projectId}-${view.id}`
    const snapshot = likec4model.$data.manualLayouts?.[view.id]
    if (snapshot) {
      result.diagram = applyLayoutDriftReasons(result.diagram, snapshot)
    }
    this.viewsWithReportedErrors.delete(key)
    this.cache.set(view, result)
    return result
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
