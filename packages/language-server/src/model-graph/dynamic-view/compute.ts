import type {
  Color,
  ComputedDynamicView,
  ComputedEdge,
  DynamicView,
  Element,
  NonEmptyArray,
  RelationID,
  RelationshipArrowType,
  RelationshipLineType,
  Tag,
  ThemeColor
} from '@likec4/core'
import {
  ancestorsFqn,
  commonAncestor,
  DefaultArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  isDynamicViewIncludeRule,
  isViewRuleAutoLayout,
  nonNullable,
  parentFqn,
  StepEdgeId
} from '@likec4/core'
import { hasAtLeast, isTruthy, map, omit, unique } from 'remeda'
import { calcViewLayoutHash } from '../../view-utils/view-hash'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputeNodes } from '../utils/buildComputeNodes'
import { buildElementNotations } from '../utils/buildElementNotations'
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate'

export namespace DynamicViewComputeCtx {
  export interface Step {
    source: Element
    target: Element
    title: string | null
    description?: string
    technology?: string
    color?: Color
    line?: RelationshipLineType
    head?: RelationshipArrowType
    tail?: RelationshipArrowType
    relations: RelationID[]
    isBackward: boolean
    tags?: NonEmptyArray<Tag>
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
    const {
      docUri: _docUri, // exclude docUri
      rules,
      steps: viewSteps,
      ...view
    } = this.view

    for (
      let {
        source: stepSource,
        target: stepTarget,
        title: stepTitle,
        isBackward,
        ...step
      } of viewSteps
    ) {
      const source = this.graph.element(stepSource)
      const target = this.graph.element(stepTarget)

      this.explicits.add(source)
      this.explicits.add(target)

      const { title, relations, tags } = this.findRelations(source, target)

      this.steps.push({
        ...step,
        source,
        target,
        title: isTruthy(stepTitle) ? stepTitle : title,
        relations: relations ?? [],
        isBackward: isBackward ?? false,
        ...(tags ? { tags } : {})
      })
    }

    for (const rule of rules) {
      if (isDynamicViewIncludeRule(rule)) {
        for (const expr of rule.include) {
          const predicate = elementExprToPredicate(expr)
          this.graph.elements.filter(predicate).forEach(e => this.explicits.add(e))
        }
      }
    }

    const elements = [...this.explicits]
    const nodesMap = buildComputeNodes(elements)

    const edges = this.steps.map(({ source, target, relations, title, isBackward, ...step }, index) => {
      const sourceNode = nonNullable(nodesMap.get(source.id), `Source node ${source.id} not found`)
      const targetNode = nonNullable(nodesMap.get(target.id), `Target node ${target.id} not found`)
      const stepNum = index + 1
      const edge: ComputedEdge = {
        id: StepEdgeId(stepNum),
        parent: commonAncestor(source.id, target.id),
        source: source.id,
        target: target.id,
        label: title,
        relations,
        color: DefaultRelationshipColor,
        line: DefaultLineStyle,
        head: DefaultArrowType,
        ...step
      }
      if (isBackward) {
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

    const nodes = applyCustomElementProperties(
      rules,
      applyViewRuleStyles(
        rules,
        // Keep order of elements
        elements.map(e => nonNullable(nodesMap.get(e.id)))
      )
    )

    const autoLayoutRule = rules.findLast(isViewRuleAutoLayout)

    const elementNotations = buildElementNotations(nodes)

    return calcViewLayoutHash({
      ...view,
      autoLayout: autoLayoutRule?.autoLayout ?? 'LR',
      nodes: map(nodes, omit(['notation'])),
      edges,
      ...(elementNotations.length > 0 && {
        notation: {
          elements: elementNotations
        }
      })
    })
  }

  private findRelations(source: Element, target: Element): {
    title: string | null
    tags: NonEmptyArray<Tag> | null
    relations: NonEmptyArray<RelationID> | null
  } {
    const relationships = unique(this.graph.edgesBetween(source, target).flatMap(e => e.relations))
    const alltags = unique(relationships.flatMap(r => r.tags ?? []))
    const tags = hasAtLeast(alltags, 1) ? alltags : null

    const relations = hasAtLeast(relationships, 1) ? map(relationships, r => r.id) : null
    if (relationships.length === 0) {
      return {
        title: null,
        tags,
        relations
      }
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
        tags,
        relations
      }
    }

    // This edge represents mutliple relations
    // We use label if only it is the same for all relations
    const labels = unique(relationships.flatMap(r => (isTruthy(r.title) ? r.title : [])))
    if (labels.length === 1) {
      return {
        title: labels[0]!,
        tags,
        relations
      }
    }

    return {
      title: null,
      tags,
      relations
    }
  }
}
