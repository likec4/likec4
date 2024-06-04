import type { ComputedDynamicView, ComputedEdge, DynamicView, EdgeId, Element, RelationID } from '@likec4/core'
import {
  ancestorsFqn,
  commonAncestor,
  DefaultArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  invariant,
  isViewRuleAutoLayout,
  nonNullable,
  parentFqn,
  StepEdgeId
} from '@likec4/core'
import { isTruthy, unique } from 'remeda'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputeNodes } from '../utils/buildComputeNodes'

export namespace DynamicViewComputeCtx {
  export interface Step {
    source: Element
    target: Element
    title: string | null
    relations: RelationID[]
    isBackward: boolean
  }
}

export class DynamicViewComputeCtx {
  // Intermediate state
  private explicits = new Set<Element>()
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

    // const sources = new Set<Element>()
    // const stepsStack = new Set<string>()

    // const sourcesOf = new Map<Fqn, Set<Element>>()

    for (let step of steps) {
      const source = this.graph.element(step.source)
      const target = this.graph.element(step.target)

      this.explicits.add(source)
      this.explicits.add(target)

      const { title, relations } = this.findRelations(source, target)

      this.steps.push({
        source,
        target,
        title: step.title ?? title,
        relations,
        isBackward: step.isBackward ?? false
      })
    }

    const elements = [...this.explicits]
    const nodesMap = buildComputeNodes(elements)

    const edges = this.steps.map(({ source, target, relations, ...step }, index) => {
      const sourceNode = nodesMap.get(source.id)
      const targetNode = nodesMap.get(target.id)
      invariant(sourceNode, `Source node ${source.id} not found`)
      invariant(targetNode, `Target node ${target.id} not found`)
      const stepNum = index + 1
      const edge: ComputedEdge = {
        id: StepEdgeId(stepNum),
        parent: commonAncestor(source.id, target.id),
        source: source.id,
        target: target.id,
        label: step.title,
        relations,
        color: DefaultRelationshipColor,
        line: DefaultLineStyle,
        head: DefaultArrowType
      }
      if (step.isBackward) {
        edge.dir = 'back'
      }

      while (edge.parent && !nodesMap.has(edge.parent)) {
        edge.parent = parentFqn(edge.parent)
      }
      sourceNode.outEdges.push(edge.id)
      targetNode.inEdges.push(edge.id)
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

    const nodes = applyViewRuleStyles(
      rules,
      // Keep order of elements
      elements.map(e => nonNullable(nodesMap.get(e.id)))
    )

    const autoLayoutRule = rules.findLast(isViewRuleAutoLayout)

    return {
      ...view,
      autoLayout: autoLayoutRule?.autoLayout ?? 'LR',
      nodes,
      edges
    }
  }

  private findRelations(source: Element, target: Element): {
    title: string | null
    relations: RelationID[]
  } {
    const relationships = this.graph.edgesBetween(source, target).flatMap(e => e.relations)
    const relations = unique(relationships.map(r => r.id))
    if (relationships.length === 0) {
      return { title: null, relations }
    }
    let relation
    if (relationships.length === 1) {
      relation = relationships[0]
    } else {
      relation = relationships.find(r => r.source === source.id && r.target === target.id)
    }

    if (relation && isTruthy(relation.title)) {
      return {
        title: relation.title,
        relations
      }
    }

    // This edge represents mutliple relations
    // We use label if only it is the same for all relations
    const labels = unique(relationships.flatMap(r => (isTruthy(r.title) ? r.title : [])))
    if (labels.length === 1) {
      return {
        title: labels[0]!,
        relations
      }
    }

    return {
      title: null,
      relations
    }
  }
}
