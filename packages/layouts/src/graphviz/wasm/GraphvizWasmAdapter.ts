import { Graphviz } from '@hpcc-js/wasm-graphviz'
import { delay } from '@likec4/core/utils'
import { loggable, rootLogger } from '@likec4/log'
import pLimit from 'p-limit'
import { randomString } from 'remeda'
import type { GraphvizPort } from '../GraphvizLayoter'
import type { DotSource } from '../types'

// limit to 1 concurrency to avoid wasm loading issues
const limit = pLimit(1)

export class GraphvizWasmAdapter implements GraphvizPort {
  /**
   * Workaround for graphviz wasm memory issues
   * After each N operations unload the wasm and reload it
   */
  private static opsCount = 0

  get name() {
    return 'wasm'
  }

  get concurrency() {
    return 1
  }

  dispose(): void {
    Graphviz.unload()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private async attempt<T>(logMessage: string, dot: string, fn: () => Promise<T>): Promise<T> {
    return await limit(async () => {
      const logger = rootLogger.getChild(['layouter', 'wasm', logMessage, '_', randomString(4).toLowerCase()])
      try {
        logger.trace`execute`
        const result = await fn()
        if (++GraphvizWasmAdapter.opsCount >= 20) {
          GraphvizWasmAdapter.opsCount = 0
          // very hacky, but helps
          logger.trace`reached 20 operations, unloading wasm`
          Graphviz.unload()
        }
        return result
      } catch (error) {
        logger.trace('FAILED DOT\n' + dot)
        const errorStr = loggable(error)

        // don't retry on syntax errors
        if (errorStr.includes('syntax error')) {
          throw error
        }
        logger.warn(errorStr)

        GraphvizWasmAdapter.opsCount = 0
        Graphviz.unload()
      }
      logger.warn('Retrying...')
      await delay(30, 300)
      return await fn()
    })
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    return await this.attempt(`unflatten`, dot, async () => {
      const graphviz = await Graphviz.load()
      const unflattened = graphviz.unflatten(dot, 1, false, 3)
      return unflattened.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
    })
  }

  async acyclic(dot: DotSource): Promise<DotSource> {
    return await this.attempt(`acyclic`, dot, async () => {
      const graphviz = await Graphviz.load()
      const res = graphviz.acyclic(dot, true)
      return res.acyclic ? (res.outFile as DotSource || dot) : dot
    })
  }

  async layoutJson(dot: DotSource): Promise<string> {
    return await this.attempt(`layout`, dot, async () => {
      const graphviz = await Graphviz.load()
      return graphviz.layout(dot, 'json', undefined, {
        yInvert: true,
      })
    })
  }

  async svg(dot: DotSource): Promise<string> {
    return await this.attempt(`svg`, dot, async () => {
      const graphviz = await Graphviz.load()
      return graphviz.layout(dot, 'svg')
    })
  }
}
