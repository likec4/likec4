import type {
  ComputedView,
  DiagramView,
  LayoutedView,
  LayoutType,
  ProjectId,
  ViewId,
} from '@likec4/core'
import { _layout, applyManualLayout, calcDriftsFromSnapshot } from '@likec4/core'
import { type AdhocViewPredicate, computeAdhocView } from '@likec4/core/compute-view'
import type { LikeC4Model } from '@likec4/core/model'
import { type LayoutTaskParams, type QueueGraphvizLayoter, GraphvizLayouter } from '@likec4/layouts'
import { loggable } from '@likec4/log'
import { type WorkspaceCache, interruptAndCheck } from 'langium'
import { isTruthy, values } from 'remeda'
import type { Writable } from 'type-fest'
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

type LayoutViewParams = {
  viewId: ViewId
  /**
   * Type of layout to apply
   * - 'manual' - applies manual layout if any
   * - 'auto' - returns latest version with drifts from manual layout if any
   * - undefined - returns latest layout as is
   */
  layoutType?: LayoutType | undefined
  projectId?: ProjectId | undefined
  cancelToken?: CancellationToken | undefined
}
export interface LikeC4Views {
  readonly layouter: GraphvizLayouter
  /**
   * Returns computed views (i.e. views with predicates computed)
   *
   * @param projectId - project id, if not specified - uses the default project
   */
  computedViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<ComputedView[]>
  /**
   * Layouts all views (ignoring any manual snapshots)
   *
   * @param projectId - project id, if not specified - uses the default project
   */
  layoutAllViews(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<GraphvizOut[]>
  /**
   * Layouts a view.
   * If layoutType is 'manual' - applies manual layout if any.
   * If layoutType is 'auto' - returns latest version with drifts from manual layout if any
   * If not specified - returns latest layout as is
   *
   * If view not found in model, but there is a snapshot - it will be returned (with empty DOT)
   *
   * @param projectId - project id, if not specified - uses the default project
   */
  layoutView(params: LayoutViewParams): Promise<GraphvizOut | null>
  /**
   * Returns diagrams.
   * If diagram has manual layout, it will be used.
   * @param projectId - project id, if not specified - uses the default project
   */
  diagrams(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<DiagramView>>
  /**
   * Returns all layouted views as Graphviz output (i.e. views with layout computed)
   * @param projectId - project id, if not specified - uses the default project
   */
  viewsAsGraphvizOut(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<GraphvizSvgOut>>
  /**
   * Open view in the preview panel.
   * (works only if running as a vscode extension)
   *
   * @param projectId - project id, if not specified - uses the default project
   */
  openView(viewId: ViewId, projectId?: ProjectId | undefined): Promise<void>

  /**
   * Computes and layouts an adhoc view (not defined in the model)
   *
   * @param projectId - project id, if not specified - uses the default project
   */
  adhocView(predicates: AdhocViewPredicate[], projectId?: ProjectId | undefined): Promise<LayoutedView>
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

    services.shared.workspace.WorkspaceManager.onForceCleanCache(() => {
      this.cache = new WeakMap<ComputedView, GraphvizOut>()
    })
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

  async layoutView({
    viewId,
    layoutType,
    projectId,
    cancelToken,
  }: LayoutViewParams): Promise<GraphvizOut | null> {
    const model = await this.ModelBuilder.computeModel(projectId, cancelToken)
    const view = model.findView(viewId)?.$view
    projectId = model.project.id
    const logger = viewsLogger.getChild(projectId)
    if (!view) {
      logger.warn`layoutView ${viewId} not found`
      const snapshot = model.findManualLayout(viewId)
      if (snapshot) {
        logger.debug`found manual layout for ${viewId}`
        let diagram = { ...snapshot } as Writable<LayoutedView>
        diagram.drifts = [
          'not-exists',
        ]
        diagram._layout = 'manual'
        return {
          diagram: diagram,
          dot: '# manual layout',
        }
      }
      return null
    }
    try {
      const m0 = performanceMark()
      const out = this.cache.get(view) ?? await this.layouter.layout({
        view,
        styles: model.$styles,
      })
      if (this.cache.has(view)) {
        logger.debug`layout ${viewId} from cache`
      } else {
        this.viewSucceed(view, model, out)
        logger.debug(`layout {viewId} in ${m0.pretty}`, { viewId })
      }
      if (isTruthy(layoutType)) {
        return {
          dot: out.dot,
          diagram: this.withLayoutType(out.diagram, model, layoutType),
        }
      }
      return out
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
      // Apply manual layout if any
      return this.withLayoutType(diagram, likeC4Model, 'manual')
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

  async adhocView(predicates: AdhocViewPredicate[], projectId?: ProjectId | undefined): Promise<LayoutedView> {
    viewsLogger.debug`layouting adhoc view...`
    const likeC4Model = await this.ModelBuilder.computeModel(projectId)
    const view = computeAdhocView(likeC4Model, predicates)
    const { diagram } = await this.layouter.layout({
      view: {
        ...view,
        hash: '',
        _type: 'element',
      },
      styles: likeC4Model.$styles,
    })
    viewsLogger.debug`layouting adhoc view... done`
    return diagram
  }

  private reportViewError(view: ComputedView, projectId: ProjectId, error: string): void {
    const key = `${projectId}-${view.id}`
    this.cache.delete(view)
    if (!this.viewsWithReportedErrors.has(key)) {
      this.services.shared.lsp.Connection?.window.showErrorMessage(`LikeC4: ${error}`)
      this.viewsWithReportedErrors.add(key)
    }
  }

  /**
   * Applies manual layout or calculates drifts from snapshot
   * if layoutType is specified
   */
  private withLayoutType<V extends LayoutedView>(
    layouted: V,
    likec4model: LikeC4Model.Computed,
    layoutType?: LayoutType,
  ): V {
    if (!layoutType) {
      return layouted
    }
    const snapshot = likec4model.findManualLayout(layouted.id)
    if (!snapshot) {
      return layouted
    }
    if (layoutType === 'manual') {
      if (layouted[_layout] === 'manual') {
        viewsLogger.error(`View ${layouted.id} already has manual layout, this should not happen`)
        return layouted
      }
      return applyManualLayout(layouted, snapshot)
    }
    return calcDriftsFromSnapshot(layouted, snapshot)
  }

  private viewSucceed(
    view: ComputedView,
    likec4model: LikeC4Model.Computed,
    result: GraphvizOut,
  ): GraphvizOut {
    const projectId = likec4model.project.id
    const key = `${projectId}-${view.id}`
    this.viewsWithReportedErrors.delete(key)
    this.cache.set(view, result)
    return result
  }
}
