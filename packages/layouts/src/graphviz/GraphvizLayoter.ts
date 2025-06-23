import {
  type AnyAux,
  type aux,
  type ComputedView,
  type DiagramView,
  type Specification,
  isDeploymentView,
  isDynamicView,
  isElementView,
  nonexhaustive,
} from '@likec4/core'
import { loggable, rootLogger } from '@likec4/log'
import { applyManualLayout } from '../manual/applyManualLayout'
import { DeploymentViewPrinter } from './DeploymentViewPrinter'
import { DynamicViewPrinter } from './DynamicViewPrinter'
import { ElementViewPrinter } from './ElementViewPrinter'
import { parseGraphvizJson } from './GraphvizParser'
import type { DotSource } from './types'
import type { GraphvizJson } from './types-dot'
import { GraphvizWasmAdapter } from './wasm/GraphvizWasmAdapter'

export interface GraphvizPort extends Disposable {
  get concurrency(): number
  unflatten(dot: DotSource): Promise<DotSource>
  acyclic(dot: DotSource): Promise<DotSource>
  layoutJson(dot: DotSource): Promise<string>
  svg(dot: DotSource): Promise<string>
}

const getPrinter = <A extends AnyAux>({ view, specification }: LayoutTaskParams<A>) => {
  switch (true) {
    case isDynamicView(view):
      return new DynamicViewPrinter(view, specification)
    case isDeploymentView(view):
      return new DeploymentViewPrinter(view, specification)
    case isElementView(view):
      return new ElementViewPrinter(view, specification)
    default:
      nonexhaustive(view)
  }
}

export type LayoutTaskParams<A extends aux.Any = aux.Any> = {
  view: ComputedView<A>
  specification: Specification<A>
}

export type LayoutResult<A extends aux.Any = aux.Any> = {
  dot: DotSource
  diagram: DiagramView<A>
}
const logger = rootLogger.getChild(['layouter'])

export class GraphvizLayouter implements Disposable {
  private graphviz: GraphvizPort

  constructor(graphviz?: GraphvizPort) {
    this.graphviz = graphviz ?? new GraphvizWasmAdapter()
  }

  get graphvizPort(): GraphvizPort {
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

  async layout<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<LayoutResult<A>> {
    try {
      logger.debug`layouting view ${params.view.id}...`
      let dot = await this.dot(params)
      const { view } = params
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
            const printer = getPrinter(params)
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

      logger.debug`layouting view ${params.view.id} done`
      return { dot, diagram }
    } catch (e) {
      throw new Error(`Error during layout: ${params.view.id}`, { cause: e })
    }
  }

  async svg<A extends AnyAux>(params: LayoutTaskParams<A>) {
    let dot = await this.dot(params)
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

  async dot<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<DotSource> {
    const printer = getPrinter(params)
    let dot = printer.print()
    if (!isElementView(params.view)) {
      return dot
    }
    try {
      return await this.graphviz.unflatten(dot)
    } catch (error) {
      logger.warn(`Error during unflatten: ${params.view.id}`, { error })
      return dot
    }
  }

  // async layoutOverviewGraph(views: ComputedView[]): Promise<OverviewGraph> {
  //   if (views.length === 0) {
  //     return Promise.resolve({
  //       nodes: [],
  //       edges: [],
  //       bounds: { x: 0, y: 0, width: 10, height: 10 },
  //     })
  //   }
  //   const dot = OverviewDiagramsPrinter.toDot(views)
  //   const json = await this.dotToJson(dot)
  //   return parseOverviewGraphvizJson(json)
  // }
}
