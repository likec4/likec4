import { Graphviz } from '@hpcc-js/wasm/graphviz'
import { delay } from '@likec4/core'
import pLimit from 'p-limit'
import type { GraphvizPort } from '../GraphvizLayoter'
import type { DotSource } from '../types'

const limit = pLimit(1)

export class GraphvizWasmAdapter implements GraphvizPort {
  private static _graphviz: Promise<Graphviz> | null = null

  private graphviz(): Promise<Graphviz> {
    return Promise.resolve(GraphvizWasmAdapter._graphviz ??= Graphviz.load())
  }

  private async attempt<T>(fn: () => Promise<T>): Promise<T> {
    return await limit(async () => {
      try {
        try {
          return await fn()
        } catch (e) {
          console.warn('Retrying...', e)
          Graphviz.unload()
          GraphvizWasmAdapter._graphviz = null
        }

        await delay(50)

        return await fn()
      } finally {
        Graphviz.unload()
        GraphvizWasmAdapter._graphviz = null
      }
    })
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    return await this.attempt(async () => {
      const graphviz = await this.graphviz()
      const unflattened = graphviz.unflatten(dot, 1, false, 3)
      return unflattened.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
    })
  }

  async layoutJson(dot: DotSource): Promise<string> {
    return await this.attempt(async () => {
      const graphviz = await this.graphviz()
      return graphviz.layout(dot, 'json', undefined, {
        yInvert: true
      })
    })
  }

  async svg(dot: DotSource): Promise<string> {
    return await this.attempt(async () => {
      const graphviz = await this.graphviz()
      return graphviz.layout(dot, 'svg')
    })
  }
}
