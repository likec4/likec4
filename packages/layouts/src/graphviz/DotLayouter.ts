import { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedView } from '@likec4/core'
import pLimit from 'p-limit'
import { delay } from 'rambdax'
import { dotLayoutFn, type DotLayoutResult } from './dotLayout'

const limit = pLimit(1)

export class DotLayouter {
  dispose() {
    limit.clearQueue()
    Graphviz.unload()
  }

  layout(view: ComputedView): Promise<DotLayoutResult> {
    return limit(async () => {
      let graphviz = await Graphviz.load()
      try {
        return dotLayoutFn(graphviz, view)
      } catch (err) {
        Graphviz.unload()
        await delay(20)
        graphviz = await Graphviz.load()
        return dotLayoutFn(graphviz, view)
      } finally {
        Graphviz.unload()
      }
    })
  }

  svg(dot: string): Promise<string> {
    return limit(async () => {
      let graphviz = await Graphviz.load()
      try {
        return graphviz.layout(dot, 'svg', 'dot', {
          yInvert: true
        })
      } catch (err) {
        Graphviz.unload()
        await delay(20)
        graphviz = await Graphviz.load()
        return graphviz.layout(dot, 'svg', 'dot', {
          yInvert: true
        })
      } finally {
        Graphviz.unload()
      }
    })
  }
}
