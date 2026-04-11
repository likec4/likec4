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
import type { AILayoutHints } from './ai/types'
import { AiLayoutViewPrinter } from './AiLayoutPrinter'
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

function normalizeDot(dot: DotSource): DotSource {
  return dot
    .split('\n')
    .filter((l) => !(l.includes('margin') && l.includes(`${GraphClusterSpace}`))) // see DotPrinter.ts#L175
    .join('\n') as DotSource
}

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

  /**
   * Generates DOT source for the given view and styles.
   * If `hints` are provided, they will be used to influence the layout (e.g. by specifying node/edge order).
   * This method does not perform unflattening or any other post-processing on the DOT output, so it may be used for debugging or to generate DOT for external processing.
   */
  printToDot(params: LayoutTaskParams, hints?: AILayoutHints): DotSource {
    const printer = hints ? new AiLayoutViewPrinter(params.view, params.styles, hints) : getPrinter(params)
    return normalizeDot(printer.print())
  }

  protected newScopedLogger(operation: string) {
    return rootLogger.getChild([operation, '_', randomString(4).toLowerCase()])
  }

  async dotToJson(dot: DotSource): Promise<GraphvizJson> {
    const logger = this.newScopedLogger('dotToJson')
    let json
    try {
      json = await this.graphviz.layoutJson(dot)
    } catch (error) {
      logger.error(loggable(error))
      logger.error('Failed to convert DOT to JSON:\n' + dot)
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
    const logger = this.newScopedLogger('layout')
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

      dot = normalizeDot(dot)

      logger.trace`layouting view ${params.view.id} done`
      return { dot, diagram }
    } catch (e) {
      logger.warn(loggable(e))
      throw wrapError(e, `Error during layout: ${params.view.id}`)
    }
  }

  async aiLayout<A extends AnyAux>(
    { view, styles }: LayoutTaskParams<A>,
    hints: AILayoutHints,
  ): Promise<LayoutResult<A>> {
    const logger = this.newScopedLogger('ai-layout')
    try {
      logger.trace`layouting view ${view.id} using AI hints...`
      const printer = new AiLayoutViewPrinter(view, styles, hints)
      let dot = printer.print()
      const json = await this.dotToJson(dot)
      let diagram = parseGraphvizJson(json, view)
      dot = normalizeDot(dot)
      logger.trace`layouting view ${view.id} done`
      return { dot, diagram }
    } catch (e) {
      logger.warn(loggable(e))
      throw wrapError(e, `Error during AI layout: ${view.id}`)
    }
  }

  async svg<A extends AnyAux>(params: LayoutTaskParams<A>) {
    let dot = await this.dot(params)
    dot = normalizeDot(dot)
    const svg = await this.graphviz.svg(dot)
    return {
      svg,
      dot,
    }
  }

  async dot<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<DotSource> {
    const logger = this.newScopedLogger('dot')
    logger.trace`generating dot for view ${params.view.id}`
    const printer = getPrinter(params)
    let dot = printer.print()
    if (!isElementView(params.view)) {
      return normalizeDot(dot)
    }
    try {
      logger.trace`unflattening dot`
      dot = await this.graphviz.unflatten(dot)
    } catch (error) {
      logger.warn(`Error during unflatten: ${params.view.id}`, { error })
    }
    return normalizeDot(dot)
  }

  async layoutProjectsView(view: ComputedProjectsView): Promise<LayoutedProjectsView> {
    const logger = this.newScopedLogger('layoutProjectsView')
    logger.debug`layouting projects overview...`
    const printer = new ProjectsViewPrinter(view)
    let dot = printer.print()
    try {
      dot = await this.graphviz.unflatten(dot)
    } catch (error) {
      logger.warn(`Error during unflatten of projects view`, { error })
    }
    const json = await this.dotToJson(dot)
    logger.debug`layouting projects overview done`
    return parseGraphvizJsonOfProjectsView(json, view)
  }
}
