import { type ComputedView, type DiagramView, isComputedDynamicView } from '@likec4/core'
import { applyManualLayout } from '../manual/applyManualLayout'
import { DynamicViewPrinter } from './DynamicViewPrinter'
import { ElementViewPrinter } from './ElementViewPrinter'
import { parseGraphvizJson } from './GraphvizParser'
import { stringHash } from './stringHash'
import type { DotSource } from './types'

export interface GraphvizPort {
  unflatten(dot: DotSource): Promise<DotSource>
  acyclic(dot: DotSource): Promise<DotSource>
  layoutJson(dot: DotSource): Promise<string>
  svg(dot: DotSource): Promise<string>
}

const getPrinter = (computedView: ComputedView) =>
  isComputedDynamicView(computedView) ? new DynamicViewPrinter(computedView) : new ElementViewPrinter(computedView)

export type LayoutResult = {
  dot: DotSource
  diagram: DiagramView
}
export class GraphvizLayouter {
  constructor(private graphviz: GraphvizPort) {}

  get port() {
    return this.graphviz
  }

  changePort(graphviz: GraphvizPort) {
    this.graphviz = graphviz
  }

  async layout(view: ComputedView): Promise<LayoutResult> {
    let dot = await this.dot(view)
    const hash = stringHash(dot)
    const rawjson = await this.graphviz.layoutJson(dot)
    let diagram = parseGraphvizJson(rawjson, view)
    diagram.hash = hash

    if (view.manualLayout) {
      const result = applyManualLayout(diagram, view.manualLayout)
      if (result.relayout) {
        const printer = getPrinter(view)
        // TODO: apply manual layout fails when there are edges with compounds
        if (printer.hasEdgesWithCompounds) {
          console.error(`Manual layout for view ${view.id} is ignored, as edges with compounds are not supported`)
        } else {
          printer.applyManualLayout(result.relayout)
          const rawjson = await this.graphviz.layoutJson(printer.print())
          diagram = parseGraphvizJson(rawjson, view)
          diagram.hash = hash
        }
      } else {
        diagram = result.diagram
      }
    }

    dot = dot
      .split('\n')
      .filter((l) => !(l.includes('margin') && l.includes('50.1'))) // see DotPrinter.ts#L175
      .join('\n') as DotSource
    return { dot, diagram }
  }

  async svg(view: ComputedView) {
    let dot = await this.dot(view)
    dot = dot
      .split('\n')
      .filter((l) => !(l.includes('margin') && l.includes('50.1'))) // see DotPrinter.ts#L175
      .join('\n') as DotSource
    const svg = await this.graphviz.svg(dot)
    return {
      svg,
      dot
    }
  }

  async dot(computedView: ComputedView): Promise<DotSource> {
    const printer = getPrinter(computedView)
    if (isComputedDynamicView(computedView)) {
      return printer.print()
    }

    let dot = printer.print()
    // let dot = await this.graphviz.acyclic(printer.print())
    dot = await this.graphviz.unflatten(dot)

    return dot
  }
}
