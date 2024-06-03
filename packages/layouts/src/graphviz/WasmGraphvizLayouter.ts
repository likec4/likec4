import { Graphviz } from '@hpcc-js/wasm/graphviz'
import { type ComputedView, delay, isComputedElementView } from '@likec4/core'
import pLimit from 'p-limit'
import { parseGraphvizJson } from './parseGraphvizJson'
import { printDynamicViewToDot } from './printDynamicViewToDot'
import { printElementViewToDot } from './printElementViewToDot'
import type { DotLayoutResult, DotSource } from './types'

const limit = pLimit(1)

export interface GraphvizLayouter {
  dispose(): void
  layout(view: ComputedView): Promise<DotLayoutResult>
  svg(dot: string, view: ComputedView): Promise<string>
}

function toDot(graphviz: Graphviz, computedView: ComputedView) {
  if (isComputedElementView(computedView)) {
    const initial = printElementViewToDot(computedView)

    // const acyclicResult = graphviz.acyclic(initial, true)
    // const acyclicDot = acyclicResult.outFile ?? initial

    // console.log('acyclicDot ---------------')
    // console.log(acyclicDot)
    // console.log('acyclicDot ---------------')

    const unflattened = graphviz.unflatten(initial, 1, true, 2)
    return unflattened.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
  }
  return printDynamicViewToDot(computedView)
}

// WASM Graphviz layouter
export class WasmGraphvizLayouter implements GraphvizLayouter {
  dispose() {
    limit.clearQueue()
    Graphviz.unload()
  }

  async layout(view: ComputedView): Promise<DotLayoutResult> {
    return await limit(async () => {
      // Attempt 1
      let result = await this.attempt(view)
      if (result) {
        return result
      }
      console.warn('Retrying...')
      await delay(50)
      // Attempt 2
      result = await this.attempt(view)
      if (result) {
        console.info('Retry succeeded')
        return result
      }
      throw new Error('Failed to layout with graphviz')
    })
  }

  private async attempt(view: ComputedView) {
    try {
      const graphviz = await Graphviz.load()
      const dot = toDot(graphviz, view)
      const rawjson = graphviz.dot(dot, 'json', {
        yInvert: true
      })

      const diagram = parseGraphvizJson(rawjson, view)

      return {
        dot: dot
          .split('\n')
          // workaround for graphviz svg issue (only in cli)
          .filter(l => !l.includes('margin=33.21') && !l.includes('margin = 33.21'))
          .join('\n') as DotSource,
        diagram
      }
    } catch (err) {
      console.error(`Failed attempt to layout with graphviz: ${view.id}`)
      console.error(err)
      return null
    } finally {
      Graphviz.unload()
    }
  }

  async svg(dot: string, _view: ComputedView): Promise<string> {
    return await limit(async () => {
      try {
        const graphviz = await Graphviz.load()
        return graphviz.layout(dot, 'svg', 'dot', {
          yInvert: true
        })
      } finally {
        Graphviz.unload()
      }
    })
  }
}
