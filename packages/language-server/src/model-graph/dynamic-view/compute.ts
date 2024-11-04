import type {
  Color,
  ComputedDynamicView,
  ComputedEdge,
  DynamicView,
  DynamicViewStep,
  Element,
  NonEmptyArray,
  RelationID,
  RelationshipArrowType,
  RelationshipLineType,
  Tag,
  ViewID
} from '@likec4/core'
import {
  ancestorsFqn,
  commonAncestor,
  DefaultArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  isDynamicViewIncludeRule,
  isDynamicViewParallelSteps,
  isViewRuleAutoLayout,
  nonNullable,
  parentFqn,
  StepEdgeId
} from '@likec4/core'
import { filter, flatMap, hasAtLeast, isTruthy, map, omit, only, pipe, unique } from 'remeda'
import { resolveGlobalRulesInDynamicView } from '../../view-utils/resolve-global-rules'
import { calcViewLayoutHash } from '../../view-utils/view-hash'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputeNodes } from '../utils/buildComputeNodes'
import { buildElementNotations } from '../utils/buildElementNotations'
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate'

export namespace DynamicViewComputeCtx {
  export interface Step {
    id: StepEdgeId
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
    navigateTo?: ViewID
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

  private addStep(
    {
      source: stepSource,
      target: stepTarget,
      title: stepTitle,
      isBackward,
      navigateTo: stepNavigateTo,
      ...step
    }: DynamicViewStep,
    index: number,
    parent?: number
  ) {
    const id = parent ? StepEdgeId(parent, index) : StepEdgeId(index)
    const source = this.graph.element(stepSource)
    const target = this.graph.element(stepTarget)

    this.explicits.add(source)
    this.explicits.add(target)

    const {
      title,
      relations,
      tags,
      navigateTo: derivedNavigateTo
    } = this.findRelations(source, target)

    const navigateTo = isTruthy(stepNavigateTo) && stepNavigateTo !== this.view.id ? stepNavigateTo : derivedNavigateTo

    this.steps.push({
      id,
      ...step,
      source,
      target,
      title: stepTitle ?? title,
      relations: relations ?? [],
      isBackward: isBackward ?? false,
      ...(navigateTo ? { navigateTo } : {}),
      ...(tags ? { tags } : {})
    })
  }

  protected compute(): ComputedDynamicView {
    const {
      docUri: _docUri, // exclude docUri
      rules: _rules, // exclude rules
      steps: viewSteps,
      ...view
    } = this.view

    let stepNum = 1
    for (const step of viewSteps) {
      if (isDynamicViewParallelSteps(step)) {
        if (step.__parallel.length === 0) {
          continue
        }
        if (step.__parallel.length === 1) {
          this.addStep(step.__parallel[0]!, stepNum)
        } else {
          step.__parallel.forEach((s, i) => this.addStep(s, i + 1, stepNum))
        }
      } else {
        this.addStep(step, stepNum)
      }
      stepNum++
    }

    const rules = resolveGlobalRulesInDynamicView(this.view, this.graph.globals)

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

    const edges = this.steps.map(({ source, target, relations, title, isBackward, ...step }) => {
      const sourceNode = nonNullable(nodesMap.get(source.id), `Source node ${source.id} not found`)
      const targetNode = nonNullable(nodesMap.get(target.id), `Target node ${target.id} not found`)
      const edge: ComputedEdge = {
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
      autoLayout: {
        direction: autoLayoutRule?.direction ?? 'LR',
        ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
        ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep })
      },
      nodes,
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
    navigateTo: ViewID | null
  } {
    const relationships = unique(this.graph.edgesBetween(source, target).flatMap(e => e.relations))
    if (relationships.length === 0) {
      return {
        title: null,
        tags: null,
        relations: null,
        navigateTo: null
      }
    }
    const alltags = pipe(
      relationships,
      flatMap(r => r.tags),
      filter(isTruthy),
      unique()
    )
    const tags = hasAtLeast(alltags, 1) ? alltags : null
    const relations = hasAtLeast(relationships, 1) ? map(relationships, r => r.id) : null

    // Most closest relation
    const relation = only(relationships) || relationships.find(r => r.source === source.id && r.target === target.id)

    // This edge represents mutliple relations
    // We use label if only it is the same for all relations
    const title = isTruthy(relation?.title) ? relation.title : pipe(
      relationships,
      map(r => r.title),
      filter(isTruthy),
      unique(),
      only()
    )

    const navigateTo = !!relation?.navigateTo && relation.navigateTo !== this.view.id ? relation.navigateTo : pipe(
      relationships,
      map(r => r.navigateTo),
      filter(isTruthy),
      filter(v => v !== this.view.id),
      unique(),
      only()
    )

    return {
      title: title ?? null,
      tags,
      relations,
      navigateTo: navigateTo ?? null
    }
  }
}
