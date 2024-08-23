import { Graphviz } from '@hpcc-js/wasm-graphviz'
import { delay } from '@likec4/core'
import { logger } from '@likec4/log'
import pLimit from 'p-limit'
import type { GraphvizPort } from '../GraphvizLayoter'
import type { DotSource } from '../types'

const limit = pLimit(1)

export class GraphvizWasmAdapter implements GraphvizPort {
  private static _graphviz: Promise<Graphviz> | null = null

  private graphviz(): Promise<Graphviz> {
    return Promise.resolve().then(() => GraphvizWasmAdapter._graphviz ??= Graphviz.load())
  }

  private async attempt<T>(logMessage: string, fn: () => Promise<T>): Promise<T> {
    return await limit(async () => {
      try {
        return await fn()
      } catch (e) {
        logger.error(e)
        logger.error(`FAILED GraphvizWasmAdapter: ${logMessage}`)
        Graphviz.unload()
        GraphvizWasmAdapter._graphviz = null
      }
      logger.warn('Retrying...')
      await delay(50)
      try {
        return await fn()
      } finally {
        Graphviz.unload()
        GraphvizWasmAdapter._graphviz = null
      }
    })
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    return await this.attempt(`unflatten\n${dot}`, async () => {
      const graphviz = await this.graphviz()
      const unflattened = graphviz.unflatten(dot, 1, false, 3)
      return unflattened.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
    })
  }

  async acyclic(dot: DotSource): Promise<DotSource> {
    return await this.attempt(`acyclic\n${dot}`, async () => {
      const graphviz = await this.graphviz()
      const res = graphviz.acyclic(dot, true)
      return res.acyclic ? (res.outFile as DotSource || dot) : dot
    })
  }

  async layoutJson(dot: DotSource): Promise<string> {
    return await this.attempt(`dot\n${dot}`, async () => {
      const graphviz = await this.graphviz()
      return graphviz.layout(dot, 'json', undefined, {
        yInvert: true
      })
    })
  }

  async svg(dot: DotSource): Promise<string> {
    return await this.attempt(`svg\n${dot}`, async () => {
      const graphviz = await this.graphviz()
      return graphviz.layout(dot, 'svg')
    })
  }
}
