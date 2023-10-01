import { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedView, DiagramView } from '@likec4/core'
import { dotLayoutFn } from './dotLayout'
import { delay } from 'rambdax'

export class DotLayouter {
  #loadPromise: Promise<Graphviz> | null = null

  dispose() {
    this.#loadPromise = null
    Graphviz.unload()
  }

  async layout(computedView: ComputedView): Promise<DiagramView> {
    const graphviz = await Graphviz.load()
    try {
      return dotLayoutFn(graphviz, computedView)
    } catch (err) {
      // Attempt to recover from memory issues
      Graphviz.unload()
      await delay(10)
      const graphviz = await Graphviz.load()
      return dotLayoutFn(graphviz, computedView)
    } finally {
      Graphviz.unload()
    }
  }

  /**
   * Workaround for some memory issues with Graphviz  WASM
   */
  async restart() {
    Graphviz.unload()
    await delay(10 + Math.trunc(Math.random() * 300))
    return this
  }

  private async load() {
    if (!this.#loadPromise) {
      this.#loadPromise = Graphviz.load()
    }
    return await this.#loadPromise
  }
}
