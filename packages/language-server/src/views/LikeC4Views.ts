// oxlint-disable typescript/no-floating-promises
import type {
  ComputedView,
  DiagramView,
  LayoutedView,
  LayoutType,
  ProjectId,
  ViewId,
} from '@likec4/core'
import {
  _layout,
  applyCachedLayout,
  applyManualLayout,
  calcDriftsFromSnapshot,
  DefaultMap,
  invariant,
} from '@likec4/core'
import { type AdhocViewPredicate, computeAdhocView } from '@likec4/core/compute-view'
import type { LikeC4Model } from '@likec4/core/model'
import { type LayoutTaskParams, type QueueGraphvizLayoter, GraphvizLayouter } from '@likec4/layouts'
import type { AILayoutHints } from '@likec4/layouts/ai'
import { type Logger, loggable } from '@likec4/log'
import { type WorkspaceCache, interruptAndCheck } from 'langium'
import { isTruthy, values } from 'remeda'
import type { Writable } from 'type-fest'
import { type Storage, createStorage, prefixStorage } from 'unstorage'
import type { CancellationToken } from 'vscode-languageserver'
import { logger, logger as rootLogger, logWarnError } from '../logger'
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

export type LayoutViewParams = {
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
  /** Optional AI-generated layout hints */
  layoutHints?: AILayoutHints | undefined
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
   * If `layoutType` is 'manual' - applies manual layout if any.
   * If `layoutType` is 'auto' - returns latest version with drifts from manual layout if any
   * If not specified - returns latest layout as is
   *
   * If `layoutHints` are provided, they will be used, ignoring any manual snapshots, and the resulting layout will not be cached (i.e. it will be computed on every call)
   *
   * If view not found in model, but there is a snapshot - it will be returned (with empty DOT)
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
  #storage: Storage
  #projectStorages = new DefaultMap((projectId: ProjectId) =>
    new ProjectStorage({
      projectId,
      storage: prefixStorage(this.#storage, projectId),
      layouter: (task) => this.layouter.layout(task),
    })
  )

  private ModelBuilder: LikeC4ModelBuilder

  constructor(private services: LikeC4Services) {
    this.ModelBuilder = services.likec4.ModelBuilder
    this.#storage = createStorage()
    // this.cache = new ProjectViewsCache(services)
    services.shared.workspace.WorkspaceManager.onForceCleanCache(() => {
      viewsLogger.info`force clean cache`
      this.#storage.clear()
    })
    services.shared.workspace.ManualLayouts.onManualLayoutUpdate(({ projectId, viewId }) => {
      if (this.#projectStorages.has(projectId) && viewId) {
        this.projectStorage(projectId).clearView(viewId)
      }
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
    const projectId = likeC4Model.project.id
    const logger = viewsLogger.getChild(projectId)
    const projectScope = this.projectStorage(projectId)
    const tasks = [] as LayoutTaskParams[]
    const styles = likeC4Model.$styles
    const results = [] as GraphvizOut[]
    //
    for (const view of views) {
      const task = { view, styles }
      let cached = await projectScope.get(task)
      if (cached) {
        results.push(cached)
        continue
      }
      tasks.push(task)
    }
    if (tasks.length > 0) {
      const m0 = performanceMark()
      await this.layouter.batchLayout({
        batch: tasks,
        cancelToken,
        onSuccess: (task, result) => {
          results.push(
            projectScope.remember(task, result),
          )
        },
        onError: (task, error) => {
          logger.warn(`Fail layout view ${task.view.id}`, { error })
        },
      })
      logger.trace`layouted ${tasks.length} views in ${m0.pretty}`
    }
    if (cancelToken && cancelToken.isCancellationRequested) {
      await interruptAndCheck(cancelToken)
    }
    if (results.length !== views.length) {
      logger.warn`layouted ${results.length} of ${views.length} views`
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
    layoutHints,
  }: LayoutViewParams): Promise<GraphvizOut | null> {
    const model = await this.ModelBuilder.computeModel(projectId, cancelToken)
    const view = model.findView(viewId)?.$view
    projectId = model.project.id
    const logger = viewsLogger.getChild(projectId)

    if (layoutHints) {
      invariant(view, `View ${viewId} not found in model`) // if layoutHints are provided, the view must exist
      logger.debug`using provided AI layout hints for view ${viewId}`
      const { dot, diagram } = await this.layouter.aiLayout(
        {
          view,
          styles: model.$styles,
        },
        layoutHints,
      )
      return { dot, diagram }
    }

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
    const projectScope = this.projectStorage(projectId)
    try {
      const task = {
        view,
        styles: model.$styles,
      }
      const out = await projectScope.getOrExecute(task)
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
    this.projectStorage(projectId).reportViewError(view, () => {
      this.services.shared.lsp.Connection?.window.showErrorMessage(`LikeC4: ${error}`)
    })
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

  protected projectStorage(projectId: ProjectId): ProjectStorage {
    return this.#projectStorages.get(projectId)
  }
}

class ProjectStorage {
  #logger: Logger

  #projectId: ProjectId
  #storage: Storage<GraphvizOut>
  #layouter: (task: LayoutTaskParams) => Promise<GraphvizOut>

  constructor(opts: {
    projectId: ProjectId
    storage: Storage<any>
    layouter: (task: LayoutTaskParams) => Promise<GraphvizOut>
  }) {
    this.#logger = viewsLogger.getChild(opts.projectId)
    this.#projectId = opts.projectId
    this.#storage = opts.storage
    this.#layouter = opts.layouter
    // this.#storage = createStorage()
    // this.toDispose.push(services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Validated, (doc) => {
    //   const pm = services.shared.workspace.ProjectsManager
    //   const projectId = pm.ownerProjectId(doc)
    //   this.clear(projectId)
    // }))
    // this.toDispose.push(services.shared.workspace.DocumentBuilder.onUpdate((_changed, deleted) => {
    //   if (deleted.length > 0) { // react only on deleted documents
    //     const pm = services.shared.workspace.ProjectsManager
    //     const projects = unique(map(deleted, pm.ownerProjectId.bind(pm)))
    //     for (const project of projects) {
    //       this.clear(project)
    //     }
    //   }
    // }))
  }

  async get(task: LayoutTaskParams): Promise<GraphvizOut | undefined> {
    const key = cacheKey(task)
    const cached = await this.#storage.get(key)
    if (cached) {
      this.#logger.trace`cache hit for ${task.view.id}`
      return mergeWithCachedLayout(task.view, cached)
    }
    this.#logger.trace`cache miss for ${task.view.id}`
    return undefined
  }

  async getOrExecute(task: LayoutTaskParams): Promise<GraphvizOut> {
    const key = cacheKey(task)
    const cached = await this.#storage.get(key)
    if (cached) {
      this.#logger.trace`cache hit for ${task.view.id}`
      return mergeWithCachedLayout(task.view, cached)
    }
    this.#logger.trace`cache miss for ${task.view.id}`
    const m0 = performanceMark()
    const result = await this.#layouter(task)
    this.#logger.trace(`layouted {view} in ${m0.pretty}`, { view: task.view.id })
    await this.#storage.set(key, result)
    this.resetViewError(task.view)
    return result
  }

  remember = <A extends GraphvizOut | undefined>(task: LayoutTaskParams, result: A): A => {
    const key = cacheKey(task)
    if (result) {
      this.#storage.set(key, result).catch(err => {
        this.#logger.error(err)
      })
      this.resetViewError(task.view)
    }
    return result
  }

  reportViewError(view: ComputedView, execIfNotReported: () => unknown) {
    const key = `error:${view.id}`
    this.#storage.has(key).then(yes => {
      if (!yes) {
        this.#storage.set<any>(key, 'true')
        execIfNotReported()
      }
    })
  }

  /**
   * Clears cache for a specific view
   */
  async clearView(viewId: ViewId) {
    const keys = await this.#storage.keys(`v:${viewId}:`)
    if (keys.length === 0) {
      return
    }
    this.#logger.trace`clear ${keys.length} cached entries for view ${viewId}`
    for (const key of keys) {
      await this.#storage.remove(key)
    }
  }

  /**
   * Clears entire cache for the project
   */
  clearAll() {
    this.#logger.trace`clear caches`
    this.#storage.clear()
  }

  private resetViewError(view: ComputedView) {
    this.#storage.del(`error:${view.id}`)
  }
}

function cacheKey(task: LayoutTaskParams) {
  return `v:${task.view.id}:${task.view.hash}:${task.styles.fingerprint}`
}

function mergeWithCachedLayout(current: ComputedView, cached: GraphvizOut): GraphvizOut {
  return {
    dot: cached.dot,
    diagram: applyCachedLayout(current, cached.diagram),
  }
}
