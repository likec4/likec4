import { Graphviz } from '@hpcc-js/wasm/graphviz'
import { type ComputedView } from '@likec4/core'
import pLimit from 'p-limit'
import { delay } from 'rambdax'
import { dotLayoutFn, type DotLayoutResult } from './dotLayout'

const limit = pLimit(1)

export interface GraphvizLayouter {
  dispose(): void
  layout(view: ComputedView): Promise<DotLayoutResult>
  svg(dot: string, view: ComputedView): Promise<string>
}

// WASM Graphviz layouter
export class DotLayouter implements GraphvizLayouter {
  dispose() {
    limit.clearQueue()
    Graphviz.unload()
  }

  async layout(view: ComputedView): Promise<DotLayoutResult> {
    return await limit(async () => {
      // Attempt 1
      let result = await this.attempt(view)
      if (result) {
        return result
      }
      console.warn('Failed to layout with graphviz, retrying...')
      await delay(50)
      // Attempt 2
      result = await this.attempt(view)
      if (result) {
        return result
      }
      throw new Error('Failed to layout with graphviz')
    })
  }

  private async attempt(view: ComputedView) {
    try {
      const graphviz = await Graphviz.load()
      return dotLayoutFn(graphviz, view)
    } catch (err) {
      console.error('Failed attempt to layout with graphviz:', err)
      return null
    } finally {
      Graphviz.unload()
    }
  }

  async svg(dot: string, _view: ComputedView): Promise<string> {
    return await limit(async () => {
      try {
        const graphviz = await Graphviz.load()
        return graphviz.layout(dot, 'svg', 'dot', {
          yInvert: true
        })
      } finally {
        Graphviz.unload()
      }
    })
  }
}
