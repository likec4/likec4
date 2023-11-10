import { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedView, DiagramView } from '@likec4/core'
import pLimit from 'p-limit'
import { delay } from 'rambdax'
import { dotLayoutFn } from './dotLayout'

const limit = pLimit(1)

export class DotLayouter {
  dispose() {
    limit.clearQueue()
    Graphviz.unload()
  }

  async layout(view: ComputedView): Promise<DiagramView> {
    return await limit(async () => {
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
}
