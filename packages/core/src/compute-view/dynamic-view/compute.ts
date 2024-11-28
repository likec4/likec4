import { filter, flatMap, hasAtLeast, isTruthy, map, only, pipe, unique } from 'remeda'
import { nonNullable } from '../../errors'
import {
  type Color,
  type ComputedDynamicView,
  type ComputedEdge,
  DefaultArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  type DynamicView,
  type DynamicViewStep,
  type Element,
  isDynamicViewParallelSteps,
  isViewRuleAutoLayout,
  isViewRulePredicate,
  type NonEmptyArray,
  type RelationId,
  type RelationshipArrowType,
  type RelationshipLineType,
  StepEdgeId,
  type Tag,
  type ViewId
} from '../../types'
import { ancestorsFqn, commonAncestor, parentFqn } from '../../utils/fqn'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputedNodesFromElements } from '../utils/buildComputedNodes'
import { buildElementNotations } from '../utils/buildElementNotations'
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate'
import { resolveGlobalRulesInDynamicView } from '../utils/resolve-global-rules'
import { calcViewLayoutHash } from '../utils/view-hash'

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
    relations: RelationId[]
    isBackward: boolean
    navigateTo?: ViewId
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
      navigateTo: derivedNavigateTo,
      head,
      tail,
      color,
      line,
      notation
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
      ...(tags ? { tags } : {}),
      ...(head ? { head } : {}),
      ...(tail ? { tail } : {}),
      ...(color ? { color } : {}),
      ...(line ? { line } : {}),
      ...(notation ? { notation } : {})
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
      if (isViewRulePredicate(rule)) {
        for (const expr of rule.include) {
          const predicate = elementExprToPredicate(expr)
          this.graph.elements.filter(predicate).forEach(e => this.explicits.add(e))
        }
      }
    }

    const elements = [...this.explicits]
    const nodesMap = buildComputedNodesFromElements(elements)

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
      nodes: map(nodes, n => {
        // omit notation
        delete n.notation
        if (n.icon === 'none') {
          delete n.icon
        }
        return n
      }),
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
    relations: NonEmptyArray<RelationId> | null
    navigateTo: ViewId | null
    tail: RelationshipArrowType | null
    head: RelationshipArrowType | null
    color: Color | null
    line: RelationshipLineType | null
    notation: string | null
  } {
    const relationships = unique(this.graph.edgesBetween(source, target).flatMap(e => e.relations))
    if (relationships.length === 0) {
      return {
        title: null,
        tags: null,
        relations: null,
        navigateTo: null,
        tail: null,
        head: null,
        color: null,
        line: null,
        notation: null
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

    const navigateTo = !!relation?.navigateTo && relation.navigateTo !== this.view.id ? relation.navigateTo : pipe(
      relationships,
      map(r => r.navigateTo),
      filter(isTruthy),
      filter(v => v !== this.view.id),
      unique(),
      only()
    )

    const commonProperties = relationships.reduce((acc, r) => {
      isTruthy(r.title) && acc.title.push(r.title)
      isTruthy(r.tail) && acc.tail.push(r.tail)
      isTruthy(r.head) && acc.head.push(r.head)
      isTruthy(r.color) && acc.color.push(r.color)
      isTruthy(r.line) && acc.line.push(r.line)

      return acc
    }, {
      title: [] as string[],
      tail: [] as RelationshipArrowType[],
      head: [] as RelationshipArrowType[],
      color: [] as Color[],
      line: [] as RelationshipLineType[],
      notation: [] as string[]
    })

    return {
      tags,
      relations,
      navigateTo: navigateTo ?? null,
      title: pipe(commonProperties.title, unique(), only()) ?? null,
      tail: pipe(commonProperties.tail, unique(), only()) ?? null,
      head: pipe(commonProperties.head, unique(), only()) ?? null,
      color: pipe(commonProperties.color, unique(), only()) ?? null,
      line: pipe(commonProperties.line, unique(), only()) ?? null,
      notation: pipe(commonProperties.notation, unique(), only()) ?? null
    }
  }
}
