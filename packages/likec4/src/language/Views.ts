import type { ComputedLikeC4Model, ComputedView, DiagramView, OverviewGraph, ViewID } from '@likec4/core'
import type { DotLayoutResult, DotSource, GraphvizLayouter } from '@likec4/layouts'
import type { WorkspaceCache } from 'langium'
import pLimit from 'p-limit'
import { isTruthy } from 'remeda'
import type { CliServices } from './module'

type GraphvizOut = {
  id: ViewID
  dot: DotSource
  svg: string
}

export class Views {
  private cache = new WeakMap<ComputedView, DotLayoutResult>()

  private layouter: GraphvizLayouter

  private previousAction = Promise.resolve() as Promise<unknown>

  private limit = pLimit(2)

  constructor(private services: CliServices) {
    this.layouter = services.likec4.Layouter
  }

  private inflightRequest: Promise<ComputedLikeC4Model | null> | undefined

  async computedViews(): Promise<ComputedView[]> {
    try {
      this.inflightRequest ??= Promise.resolve().then(async () =>
        await this.services.likec4.ModelBuilder.buildComputedModel()
      )
      const model = await Promise.resolve(this.inflightRequest)
      return Object.values(model?.views ?? {})
    } finally {
      this.inflightRequest = undefined
    }
  }

  async layoutViews(): Promise<Array<Readonly<DotLayoutResult>>> {
    const logger = this.services.logger
    const action = this.previousAction
      .then(async () => {
        const views = await this.computedViews()

        const tasks = views.map(view =>
          this.limit(async () => {
            try {
              let result = this.cache.get(view)
              if (!result) {
                result = await this.layouter.layout(view)
                this.cache.set(view, result)
              }
              return result
            } catch (e) {
              logger.error(e)
              return null
            }
          })
        )

        return (await Promise.all(tasks)).filter(isTruthy)
      })

    this.previousAction = action.catch(e => {
      // Ignore errors from previousPromise
      logger.error(e)
      return Promise.resolve([])
    })
    return await action
  }

  async diagrams(): Promise<Array<DiagramView>> {
    const layouted = await this.layoutViews()
    return layouted.map(l => l.diagram)
  }

  async viewsAsGraphvizOut(): Promise<Array<GraphvizOut>> {
    const KEY = 'All-LayoutedViews-DotWithSvg'
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, GraphvizOut[]>
    if (cache.has(KEY)) {
      return await Promise.resolve(cache.get(KEY)!)
    }
    const views = await this.computedViews()
    const tasks = views.map(l =>
      this.limit(async (): Promise<GraphvizOut> => {
        const { dot, svg } = await this.layouter.svg(l)
        return {
          id: l.id,
          dot,
          svg
        }
      })
    )
    const results = await Promise.all(tasks)
    cache.set(KEY, results)
    return results
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
