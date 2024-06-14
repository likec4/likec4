import { type ComputedView, type DiagramView, isComputedDynamicView } from '@likec4/core'
import { DynamicViewPrinter } from './DynamicViewPrinter'
import { ElementViewPrinter } from './ElementViewPrinter'
import { parseGraphvizJson } from './GraphvizParser'
import type { DotSource } from './types'

export interface GraphvizPort {
  unflatten(dot: DotSource): Promise<DotSource>

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

  async layout(view: ComputedView, previous?: DiagramView): Promise<LayoutResult> {
    const dot = await this.dot(view, previous)
    const rawjson = await this.graphviz.layoutJson(dot)
    const diagram = parseGraphvizJson(rawjson, view)
    return { dot, diagram }
  }

  async svg(view: ComputedView, previous?: DiagramView) {
    const dot = await this.dot(view, previous)
    const svg = await this.graphviz.svg(dot)
    return {
      svg,
      dot
    }
  }

  async dot(computedView: ComputedView, previous?: DiagramView): Promise<DotSource> {
    if (isComputedDynamicView(computedView)) {
      return DynamicViewPrinter.toDot(computedView)
    }

    const printer = isComputedDynamicView(computedView)
      ? new DynamicViewPrinter(computedView)
      : new ElementViewPrinter(computedView)

    if (previous) {
      return printer.useInitional(previous).print()
    }

    if (isComputedDynamicView(computedView)) {
      return printer.print()
    }

    return await this.graphviz.unflatten(printer.print())
  }
}
