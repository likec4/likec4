import {
  type AnyAux,
  type aux,
  type ComputedView,
  type DiagramView,
  type LayoutedDynamicView,
  isDeploymentView,
  isDynamicView,
  isElementView,
  LikeC4Styles,
} from '@likec4/core'
import type { ComputedProjectsView, LayoutedProjectsView } from '@likec4/core/compute-view'
import { nonexhaustive } from '@likec4/core/utils'
import { loggable, rootLogger as mainLogger, wrapError } from '@likec4/log'
import { randomString } from 'remeda'
import { calcSequenceLayout } from '../sequence'
import { DeploymentViewPrinter } from './DeploymentViewPrinter'
import { GraphClusterSpace } from './DotPrinter'
import { DynamicViewPrinter } from './DynamicViewPrinter'
import { ElementViewPrinter } from './ElementViewPrinter'
import { parseGraphvizJson, parseGraphvizJsonOfProjectsView } from './GraphvizParser'
import { ProjectsViewPrinter } from './ProjectsViewPrinter'
import type { DotSource } from './types'
import type { GraphvizJson } from './types-dot'
import { GraphvizWasmAdapter } from './wasm/GraphvizWasmAdapter'

export interface GraphvizPort extends Disposable {
  get name(): string
  get concurrency(): number
  unflatten(dot: DotSource): Promise<DotSource>
  acyclic(dot: DotSource): Promise<DotSource>
  layoutJson(dot: DotSource): Promise<string>
  svg(dot: DotSource): Promise<string>
  dispose(): void
}

const getPrinter = <A extends AnyAux>({ view, styles }: LayoutTaskParams<A>) => {
  switch (true) {
    case isDynamicView(view):
      return new DynamicViewPrinter(view, styles)
    case isDeploymentView(view):
      return new DeploymentViewPrinter(view, styles)
    case isElementView(view):
      return new ElementViewPrinter(view, styles)
    default:
      nonexhaustive(view)
  }
}

export type LayoutTaskParams<A extends aux.Any = aux.Any> = {
  view: ComputedView<A>
  styles: LikeC4Styles
}

export type LayoutResult<A extends aux.Any = aux.Any> = {
  dot: DotSource
  diagram: DiagramView<A>
}

const rootLogger = mainLogger.getChild('layouter')

export class GraphvizLayouter implements Disposable {
  private graphviz: GraphvizPort

  constructor(graphviz?: GraphvizPort) {
    this.graphviz = graphviz ?? new GraphvizWasmAdapter()
    rootLogger.trace`created with port ${this.graphviz.name}`
  }

  dispose(): void {
    this.graphviz.dispose()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  get graphvizPort(): GraphvizPort {
    return this.graphviz
  }

  changePort(graphviz: GraphvizPort) {
    this.graphviz.dispose()
    this.graphviz = graphviz
    rootLogger.trace`change port to ${this.graphviz.name}`
  }

  printToDot(params: LayoutTaskParams): DotSource {
    const printer = getPrinter(params)
    return printer.print()
  }

  async dotToJson(dot: DotSource): Promise<GraphvizJson> {
    const logger = rootLogger.getChild(['dotToJson', randomString(3)])
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
    const logger = rootLogger.getChild(['layout', randomString(3)])
    try {
      logger.trace`layouting view ${params.view.id}...`
      let dot = await this.dot(params)
      const { view } = params
      const json = await this.dotToJson(dot)
      let diagram = parseGraphvizJson(json, view)

      if (isDynamicView(diagram)) {
        Object.assign(
          diagram,
          {
            sequenceLayout: calcSequenceLayout(diagram),
          } satisfies Partial<LayoutedDynamicView<A>>,
        )
      }

      dot = dot
        .split('\n')
        .filter((l) => !(l.includes('margin') && l.includes(`${GraphClusterSpace}`))) // see DotPrinter.ts#L175
        .join('\n') as DotSource

      logger.debug`layouting view ${params.view.id} ✅`
      return { dot, diagram }
    } catch (e) {
      logger.warn(loggable(e))
      throw wrapError(e, `Error during layout: ${params.view.id}`)
    }
  }

  async svg<A extends AnyAux>(params: LayoutTaskParams<A>) {
    let dot = await this.dot(params)
    dot = dot
      .split('\n')
      .filter((l) => !(l.includes('margin') && l.includes(`${GraphClusterSpace}`))) // see DotPrinter.ts#L175
      .join('\n') as DotSource
    const svg = await this.graphviz.svg(dot)
    return {
      svg,
      dot,
    }
  }

  async dot<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<DotSource> {
    const logger = rootLogger.getChild(['dot', randomString(3)])
    logger.trace`generating dot for view ${params.view.id}`
    const printer = getPrinter(params)
    let dot = printer.print()
    if (!isElementView(params.view)) {
      return dot
    }
    try {
      logger.trace`unflattening dot`
      return await this.graphviz.unflatten(dot)
    } catch (error) {
      logger.warn(`Error during unflatten: ${params.view.id}`, { error })
      return dot
    }
  }

  async layoutProjectsView(view: ComputedProjectsView): Promise<LayoutedProjectsView> {
    const logger = rootLogger.getChild(['layoutProjectsView', randomString(3)])
    logger.trace`layouting projects overview...`
    const printer = new ProjectsViewPrinter(view)
    let dot = printer.print()
    try {
      dot = await this.graphviz.unflatten(dot)
    } catch (error) {
      logger.warn(`Error during unflatten of projects view`, { error })
    }
    const json = await this.dotToJson(dot)
    logger.debug`layouting ${'projects overview'} ✅`
    return parseGraphvizJsonOfProjectsView(json, view)
  }
}
