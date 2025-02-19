import { type DiagramView, type OverviewGraph, ComputedView, nonexhaustive } from '@likec4/core'
import { loggable, rootLogger } from '@likec4/log'
import { applyManualLayout } from '../manual/applyManualLayout'
import { DeploymentViewPrinter } from './DeploymentViewPrinter'
import { DynamicViewPrinter } from './DynamicViewPrinter'
import { ElementViewPrinter } from './ElementViewPrinter'
import { parseGraphvizJson, parseOverviewGraphvizJson } from './GraphvizParser'
import { OverviewDiagramsPrinter } from './OverviewDiagramsPrinter'
import type { DotSource } from './types'
import type { GraphvizJson } from './types-dot'

export interface GraphvizPort {
  unflatten(dot: DotSource): Promise<DotSource>
  acyclic(dot: DotSource): Promise<DotSource>
  layoutJson(dot: DotSource): Promise<string>
  svg(dot: DotSource): Promise<string>
}

const getPrinter = (computedView: ComputedView) => {
  switch (true) {
    case ComputedView.isDynamic(computedView):
      return new DynamicViewPrinter(computedView)
    case ComputedView.isDeployment(computedView):
      return new DeploymentViewPrinter(computedView)
    case ComputedView.isElement(computedView):
      return new ElementViewPrinter(computedView)
    default:
      nonexhaustive(computedView)
  }
}

export type LayoutResult = {
  dot: DotSource
  diagram: DiagramView
}
const logger = rootLogger.getChild('graphviz-layouter')

export class GraphvizLayouter {
  constructor(private graphviz: GraphvizPort) {}

  get port() {
    return this.graphviz
  }

  changePort(graphviz: GraphvizPort) {
    this.graphviz = graphviz
  }

  async dotToJson(dot: DotSource): Promise<GraphvizJson> {
    let json
    try {
      json = await this.graphviz.layoutJson(dot)
    } catch (error) {
      logger.error(loggable(error))
      logger.error`Failed to convert DOT to JSON:\n${dot}`
      throw error
    }
    try {
      return JSON.parse(json) as GraphvizJson
    } catch (error) {
      logger.error(loggable(error))
      logger.error`Failed to parse JSON:\n${json}\n. Generated from DOT:\n${dot}`
      throw error
    }
  }

  async layout(view: ComputedView): Promise<LayoutResult> {
    try {
      let dot = await this.dot(view)
      const json = await this.dotToJson(dot)
      let diagram = parseGraphvizJson(json, view)

      if (view.manualLayout) {
        const result = applyManualLayout(diagram, view.manualLayout)
        if (result.diagram) {
          diagram = result.diagram
        } else {
          // apply manual layout if only new diagram has some nodes
          // from the previous layout
          if (result.relayout.nodes.length > 0) {
            const printer = getPrinter(view)
            // TODO: apply manual layout fails when there are edges with compounds
            if (printer.hasEdgesWithCompounds) {
              // edges with coumpoudns are using _.ltail, _.lhead
              // This is not supported by FDP
              logger.warn(`Manual layout for view ${view.id} is ignored, as edges with compounds are not supported`)
            } else {
              printer.applyManualLayout(result.relayout)
              const rawjson = await this.dotToJson(printer.print())
              diagram = parseGraphvizJson(rawjson, view)
            }
          }
          diagram.hasLayoutDrift = true
        }
      }

      dot = dot
        .split('\n')
        .filter((l) => !(l.includes('margin') && l.includes('50.1'))) // see DotPrinter.ts#L175
        .join('\n') as DotSource
      return { dot, diagram }
    } catch (e) {
      throw new Error(`Error during layout: ${view.id}`, { cause: e })
    }
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
      dot,
    }
  }

  async dot(computedView: ComputedView): Promise<DotSource> {
    const printer = getPrinter(computedView)
    let dot = printer.print()
    if (!ComputedView.isElement(computedView)) {
      return dot
    }
    try {
      return await this.graphviz.unflatten(dot)
    } catch (error) {
      logger.warn(`Error during unflatten: ${computedView.id}`, { error })
      return dot
    }
  }

  async layoutOverviewGraph(views: ComputedView[]): Promise<OverviewGraph> {
    if (views.length === 0) {
      return Promise.resolve({
        nodes: [],
        edges: [],
        bounds: { x: 0, y: 0, width: 10, height: 10 },
      })
    }
    const dot = OverviewDiagramsPrinter.toDot(views)
    const json = await this.dotToJson(dot)
    return parseOverviewGraphvizJson(json)
  }
}
