import type { ComputedView, DiagramView, OverviewGraph, ViewId } from '@likec4/core'
import { GraphvizLayouter } from '@likec4/layouts'
import { type Cancellation, type WorkspaceCache } from 'langium'
import { values } from 'remeda'
import { logError, logWarnError } from '../logger'
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

export class LikeC4Views {
  private cache = new WeakMap<ComputedView, GraphvizOut>()

  private viewsWithReportedErrors = new Set<ViewId>()

  constructor(private services: LikeC4Services) {
  }

  get layouter(): GraphvizLayouter {
    return this.services.likec4.Layouter
  }

  async computedViews(cancelToken?: Cancellation.CancellationToken): Promise<ComputedView[]> {
    const model = await this.services.likec4.ModelBuilder.buildComputedModel(cancelToken)
    return model ? values(model.views) : []
  }

  async layoutAllViews(cancelToken?: Cancellation.CancellationToken): Promise<Array<Readonly<GraphvizOut>>> {
    const views = await this.computedViews(cancelToken)
    if (views.length === 0) {
      return []
    }
    const results = [] as GraphvizOut[]
    const tasks = [] as Promise<GraphvizOut>[]
    for (const view of views) {
      this.viewsWithReportedErrors.delete(view.id)
      tasks.push(
        this.layouter.layout(view)
          .then(result => {
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
    return results
  }

  async layoutView(viewId: ViewId, cancelToken?: Cancellation.CancellationToken): Promise<GraphvizOut | null> {
    const model = await this.services.likec4.ModelBuilder.buildComputedModel(cancelToken)
    const view = model?.views[viewId]
    if (!view) {
      return null
    }
    let cached = this.cache.get(view)
    if (cached) {
      return await Promise.resolve(cached)
    }
    try {
      const result = await this.layouter.layout(view)
      this.viewsWithReportedErrors.delete(viewId)
      this.cache.set(view, result)
      return result
    } catch (e) {
      if (!this.viewsWithReportedErrors.has(viewId)) {
        const errMessage = e instanceof Error ? e.message : '' + e
        this.services.shared.lsp.Connection?.window.showErrorMessage(`LikeC4: ${errMessage}`)
        this.viewsWithReportedErrors.add(viewId)
      }
      logError(e)
      return Promise.reject(e)
    }
  }

  async diagrams(): Promise<Array<DiagramView>> {
    const layouted = await this.layoutAllViews()
    return layouted.map(l => l.diagram)
  }

  async viewsAsGraphvizOut(): Promise<Array<GraphvizSvgOut>> {
    const KEY = 'All-LayoutedViews-DotWithSvg'
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, GraphvizSvgOut[]>
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
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, OverviewGraph>
    if (cache.has(KEY)) {
      return await Promise.resolve(cache.get(KEY)!)
    }
    const views = await this.computedViews()
    const overviewGraph = await this.layouter.layoutOverviewGraph(views)
    cache.set(KEY, overviewGraph)
    return overviewGraph
  }
}
