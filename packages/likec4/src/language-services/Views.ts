import type { ComputedView, DiagramView, LikeC4ComputedModel, ViewID } from '@likec4/core'
import type { DotLayoutResult, DotSource, GraphvizLayouter } from '@likec4/layouts'
import type { WorkspaceCache } from 'langium'
import { SimpleCache } from 'langium'
import pLimit from 'p-limit'
import { isTruthy } from 'remeda'
import type { CliServices } from './module'

const limit = pLimit(2)

type GraphvizOut = {
  id: ViewID
  dot: DotSource
  svg: string
}

export class Views {
  private cache = new WeakMap<ComputedView, DotLayoutResult>()

  private layouter: GraphvizLayouter

  private previousAction = Promise.resolve() as Promise<unknown>

  constructor(private services: CliServices) {
    this.layouter = services.likec4.Layouter
  }

  private inflightRequest: Promise<LikeC4ComputedModel | null> | undefined

  async computedViews(): Promise<ComputedView[]> {
    try {
      this.inflightRequest ??= this.services.likec4.ModelBuilder.buildComputedModel()
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

        const tasks = views.map(async view => {
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
      limit(async (): Promise<GraphvizOut> => {
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
}
