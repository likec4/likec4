import { type ComputedView, type DiagramView, isComputedDynamicView } from '@likec4/core'
import { DynamicViewPrinter } from './DynamicViewPrinter'
import { ElementViewPrinter } from './ElementViewPrinter'
import { parseGraphvizJson } from './GraphvizParser'
import type { DotSource } from './types'

export interface GraphvizPort {
  unflatten(dot: DotSource): Promise<DotSource>
  acyclic(dot: DotSource): Promise<DotSource>
  layoutJson(dot: DotSource): Promise<string>
  svg(dot: DotSource): Promise<string>
}

export type LayoutResult = {
  dot: DotSource
  diagram: DiagramView
}
export class GraphvizLayouter {
  constructor(private graphviz: GraphvizPort) {
  }

  get port() {
    return this.graphviz
  }

  changePort(graphviz: GraphvizPort) {
    this.graphviz = graphviz
  }

  async layout(view: ComputedView): Promise<LayoutResult> {
    const dot = await this.dot(view)
    const rawjson = await this.graphviz.layoutJson(dot)
    const diagram = parseGraphvizJson(rawjson, view)
    return { dot, diagram }
  }

  async svg(view: ComputedView) {
    const dot = await this.dot(view)
    const svg = await this.graphviz.svg(dot)
    return {
      svg,
      dot
    }
  }

  async dot(computedView: ComputedView): Promise<DotSource> {
    const printer = isComputedDynamicView(computedView)
      ? new DynamicViewPrinter(computedView)
      : new ElementViewPrinter(computedView)

    if (computedView.manualLayout) {
      printer.applyManualLayout(computedView.manualLayout)
    }

    if (isComputedDynamicView(computedView)) {
      return printer.print()
    }

    let dot = printer.print()
    // let dot = await this.graphviz.acyclic(printer.print())
    dot = await this.graphviz.unflatten(dot)

    return dot
  }
}
