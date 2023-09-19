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

  layout = async (computedView: ComputedView): Promise<DiagramView> => {
    const graphviz = await this.load()
    return dotLayoutFn(graphviz, computedView)
  }

  /**
   * Workaround for some memory issues with Graphviz  WASM
   */
  async restart() {
    this.#loadPromise = null
    Graphviz.unload()
    await delay(100)
    await this.load()
    return this
  }

  private async load() {
    if (!this.#loadPromise) {
      this.#loadPromise = Graphviz.load()
    }
    return await this.#loadPromise
  }
}
