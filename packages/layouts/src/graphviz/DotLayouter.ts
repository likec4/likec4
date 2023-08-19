import { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedView, DiagramView } from '@likec4/core'
import { dotLayoutFn } from './dotLayout'

export class DotLayouter {
  dispose() {
    Graphviz.unload()
  }

  layout = async (computedView: ComputedView): Promise<DiagramView> => {
    const graphviz = await this.load()
    return dotLayoutFn(graphviz, computedView)
  }

  #loadPromise: Promise<Graphviz> | null = null
  private async load() {
    if (!this.#loadPromise) {
      this.#loadPromise = Graphviz.load()
    }
    return await this.#loadPromise
  }
}
