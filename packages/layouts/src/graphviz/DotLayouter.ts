import { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedView } from '@likec4/core'
import pLimit from 'p-limit'
import { delay } from 'rambdax'
import { dotLayoutFn } from './dotLayout'

const limit = pLimit(1)

export class DotLayouter {
  dispose() {
    limit.clearQueue()
    Graphviz.unload()
  }

  async layout(view: ComputedView) {
    return await limit(async () => {
      let graphviz = await Graphviz.load()
      try {
        return dotLayoutFn(graphviz, view)
      } catch (err) {
        // if (isDev && err instanceof Error) {
        //   console.error(`Error in graphviz layout (view=${view.id}): ${err.stack ?? err.message}`)
        // }
        // Attempt to recover from memory issues
        Graphviz.unload()
        await delay(10)
        graphviz = await Graphviz.load()
        return dotLayoutFn(graphviz, view)
      } finally {
        Graphviz.unload()
      }
    })
  }
}
