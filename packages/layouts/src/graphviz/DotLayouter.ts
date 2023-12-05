import { Graphviz } from '@hpcc-js/wasm/graphviz'
import { type ComputedView } from '@likec4/core'
import pLimit from 'p-limit'
import { delay } from 'rambdax'
import { uniq } from 'remeda'
import { dotLayoutFn, type DotLayoutResult } from './dotLayout'
import { IconSize } from './utils'

const limit = pLimit(1)

export class DotLayouter {
  dispose() {
    limit.clearQueue()
    Graphviz.unload()
  }

  layout(view: ComputedView): Promise<DotLayoutResult> {
    return limit(async () => {
      try {
        const graphviz = await Graphviz.load()
        return dotLayoutFn(graphviz, view)
      } catch (err) {
        Graphviz.unload()
        await delay(20)
        const graphviz = await Graphviz.load()
        return dotLayoutFn(graphviz, view)
      } finally {
        Graphviz.unload()
      }
    })
  }

  svg(dot: string, { nodes }: ComputedView): Promise<string> {
    return limit(async () => {
      try {
        const images = uniq(nodes.flatMap(node => (node.icon ? [node.icon] : []))).map(path => ({
          path,
          width: IconSize,
          height: IconSize
        }))
        const graphviz = await Graphviz.load()
        return graphviz.layout(dot, 'svg', 'dot', {
          images,
          yInvert: true
        })
      } finally {
        Graphviz.unload()
      }
    })
  }
}
