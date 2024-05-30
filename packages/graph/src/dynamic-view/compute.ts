import type { ComputedDynamicView, ComputedEdge, DynamicView, EdgeId, Element, Fqn } from '@likec4/core'
import {
  ancestorsFqn,
  commonAncestor,
  DefaultArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  invariant,
  nonNullable,
  parentFqn
} from '@likec4/core'
import { buildComputeNodes } from '../compute-view/utils/buildComputeNodes'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'

export namespace DynamicViewComputeCtx {
  export interface Step {
    source: Element
    target: Element
    title: string | null
    isBackward: boolean
  }
}

export class DynamicViewComputeCtx {
  // Intermediate state
  private explicits = new Set<Element>()
  private implicits = new Set<Element>()
  private steps = [] as DynamicViewComputeCtx.Step[]

  public static compute(view: DynamicView, graph: LikeC4ModelGraph): ComputedDynamicView {
    return new DynamicViewComputeCtx(view, graph).compute()
  }

  private constructor(
    protected view: DynamicView,
    protected graph: LikeC4ModelGraph
  ) {}

  protected compute(): ComputedDynamicView {
    // reset ctx
    const { rules, steps, ...view } = this.view

    const sources = new Set<Element>()
    const stepsStack = new Set<string>()

    const sourcesOf = new Map<Fqn, Set<Element>>()

    for (const step of steps) {
      const [sourceId, targetId] = step.isBackward === true ? [step.target, step.source] : [step.source, step.target]
      const source = this.graph.element(sourceId)
      const target = this.graph.element(targetId)

      // let sources = new Set([
      //   ...(sourcesOf.get(step.target) ?? []),
      //   source,
      //   ...(sourcesOf.get(step.source) ?? [])
      // ])
      // sourcesOf.set(step.target, sources)

      // comesToFrom.)

      // let isBack = sources.has(target)

      // if (!isBack) {
      //   sources.add(source)
      // }

      // const stepKey = `${step.source} :: ${step.target}`
      // const backwardStepKey = `${step.target} :: ${step.source}`

      // let isConstraint = true
      // let isBackward = step.isBackward ?? false

      // if (isBackward) {
      //   if (stepsStack.has(stepKey)) {
      //     stepsStack.delete(stepKey)
      //     isConstraint = false
      //   } else {
      //     stepsStack.add(backwardStepKey)
      //   }
      // } else {
      //   if (stepsStack.has(backwardStepKey)) {
      //     stepsStack.delete(backwardStepKey)
      //     isConstraint = false
      //   } else {
      //     stepsStack.add(stepKey)
      //   }
      // }

      this.explicits.add(source)
      this.explicits.add(target)
      this.steps.push({
        source,
        target,
        title: step.title,
        isBackward: step.isBackward ?? false
      })
    }

    const elements = [...this.explicits]
    const nodesMap = buildComputeNodes(elements)
    // Keep the order of elements
    const nodes = elements.map(e => nonNullable(nodesMap.get(e.id)))

    const edges = this.steps.map((step, index) => {
      const source = nodesMap.get(step.source.id)
      const target = nodesMap.get(step.target.id)
      invariant(source, `Source node ${step.source.id} not found`)
      invariant(target, `Target node ${step.target.id} not found`)
      const edge: ComputedEdge = {
        id: `step-${(index + 1).toString().padStart(3, '0')}` as EdgeId,
        parent: commonAncestor(step.source.id, step.target.id),
        source: source.id,
        target: target.id,
        label: step.title,
        relations: [],
        color: DefaultRelationshipColor,
        line: DefaultLineStyle,
        head: DefaultArrowType,
        tail: 'none',
        isConstraint: step.isBackward !== true
      }

      while (edge.parent && !nodesMap.has(edge.parent)) {
        edge.parent = parentFqn(edge.parent)
      }
      source.outEdges.push(edge.id)
      target.inEdges.push(edge.id)
      // Process edge source ancestors
      for (const sourceAncestor of ancestorsFqn(edge.source)) {
        if (sourceAncestor === edge.parent) {
          break
        }
        nodesMap.get(sourceAncestor)?.outEdges.push(edge.id)
      }
      // Process target hierarchy
      for (const targetAncestor of ancestorsFqn(edge.target)) {
        if (targetAncestor === edge.parent) {
          break
        }
        nodesMap.get(targetAncestor)?.inEdges.push(edge.id)
      }
      return edge
    })

    return {
      ...view,
      autoLayout: 'LR',
      nodes,
      edges
    }
  }
}
