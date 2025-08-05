import { filter, findLast, flatMap, hasAtLeast, isTruthy, map, only, pipe, reduce, unique } from 'remeda'
import type { ElementModel, LikeC4Model } from '../../model'
import { modelConnection } from '../../model'
import type { AnyAux, aux, scalar } from '../../types'
import {
  type Color,
  type ComputedDynamicView,
  type ComputedEdge,
  type DynamicViewStep,
  type NonEmptyArray,
  type ParsedDynamicView as DynamicView,
  type RelationshipArrowType,
  type RelationshipLineType,
  type StepEdgeId,
  _stage,
  _type,
  DefaultArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  isDynamicViewParallelSteps,
  isViewRuleAutoLayout,
  isViewRulePredicate,
  stepEdgeId,
} from '../../types'
import { nonNullable } from '../../utils'
import { ancestorsFqn, commonAncestor, parentFqn } from '../../utils/fqn'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputedNodes, elementModelToNodeSource } from '../utils/buildComputedNodes'
import { buildElementNotations } from '../utils/buildElementNotations'
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate'
import { resolveGlobalRulesInDynamicView } from '../utils/resolve-global-rules'
import { calcViewLayoutHash } from '../utils/view-hash'

const { findConnection } = modelConnection

type Element<A extends AnyAux> = ElementModel<A>

namespace DynamicViewCompute {
  export interface Step<A extends AnyAux> {
    id: StepEdgeId
    source: Element<A>
    target: Element<A>
    title: string | null
    description?: string
    technology?: string
    // Notes for walkthrough
    notes?: scalar.MarkdownOrString
    color?: Color
    line?: RelationshipLineType
    head?: RelationshipArrowType
    tail?: RelationshipArrowType
    relations: scalar.RelationId[]
    isBackward: boolean
    navigateTo?: aux.StrictViewId<A>
    tags?: aux.Tags<A>
  }
}

class DynamicViewCompute<A extends AnyAux> {
  // Intermediate state
  private explicits = new Set<Element<A>>()
  private steps = [] as DynamicViewCompute.Step<A>[]

  constructor(
    protected model: LikeC4Model<A>,
    protected view: DynamicView<A>,
  ) {}

  private addStep(
    {
      source: stepSource,
      target: stepTarget,
      title: stepTitle,
      isBackward,
      navigateTo: stepNavigateTo,
      ...step
    }: DynamicViewStep<A>,
    index: number,
    parent?: number,
  ) {
    const id = parent ? stepEdgeId(parent, index) : stepEdgeId(index)
    const source = this.model.element(stepSource)
    const target = this.model.element(stepTarget)

    this.explicits.add(source)
    this.explicits.add(target)

    const {
      title,
      relations,
      tags,
      navigateTo: derivedNavigateTo,
      color,
      line,
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
      ...(color ? { color } : {}),
      ...(line ? { line } : {}),
    })
  }

  compute(): ComputedDynamicView<A> {
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

    const rules = resolveGlobalRulesInDynamicView(_rules, this.model.globals)

    for (const rule of rules) {
      if (isViewRulePredicate(rule)) {
        for (const expr of rule.include) {
          const satisfies = elementExprToPredicate(expr)
          for (const e of this.model.elements()) {
            if (satisfies(e)) {
              this.explicits.add(e)
            }
          }
        }
      }
    }

    const nodesMap = buildComputedNodes(
      [...this.explicits].map(elementModelToNodeSource),
    )

    const edges = this.steps.map(({ id, source, target, relations, title, description, isBackward, tags, ...step }) => {
      const sourceNode = nonNullable(nodesMap.get(source.id as scalar.NodeId), `Source node ${source.id} not found`)
      const targetNode = nonNullable(nodesMap.get(target.id as scalar.NodeId), `Target node ${target.id} not found`)
      const edge: ComputedEdge<A> = {
        id: id as unknown as aux.EdgeId,
        parent: commonAncestor(source.id, target.id) as scalar.NodeId | null,
        source: sourceNode.id,
        target: targetNode.id,
        label: title,
        relations,
        description: description ? { txt: description } : null,
        color: DefaultRelationshipColor,
        line: DefaultLineStyle,
        head: DefaultArrowType,
        tags: tags ?? [],
        ...step,
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
        [...this.explicits].map(e => nonNullable(nodesMap.get(e.id as scalar.NodeId))),
      ),
    )

    const autoLayoutRule = findLast(rules, isViewRuleAutoLayout)

    const nodeNotations = buildElementNotations(nodes)

    return calcViewLayoutHash({
      ...view,
      [_type]: 'dynamic',
      [_stage]: 'computed',
      autoLayout: {
        direction: autoLayoutRule?.direction ?? 'LR',
        ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
        ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep }),
      },
      nodes: map(nodes, n => {
        if (n.icon === 'none') {
          delete n.icon
        }
        return n
      }),
      edges,
      ...(nodeNotations.length > 0 && {
        notation: {
          nodes: nodeNotations,
        },
      }),
    })
  }

  private findRelations(source: Element<A>, target: Element<A>): {
    title: string | null
    tags: aux.Tags<A> | null
    relations: NonEmptyArray<aux.RelationId> | null
    navigateTo: aux.StrictViewId<A> | null
    color: Color | null
    line: RelationshipLineType | null
  } {
    const relationships = findConnection(source, target, 'directed').flatMap(r => [...r.relations])
    if (relationships.length === 0) {
      return {
        title: null,
        tags: null,
        relations: null,
        navigateTo: null,
        color: null,
        line: null,
      }
    }
    const alltags = pipe(
      relationships,
      flatMap(r => r.tags),
      filter(isTruthy),
      unique(),
    ) as aux.Tags<A>
    const tags = hasAtLeast(alltags, 1) ? alltags : null
    const relations = hasAtLeast(relationships, 1) ? map(relationships, r => r.id) : null

    // Most closest relation
    const relation = only(relationships) || relationships.find(r => r.source === source && r.target === target)
    const relationNavigateTo = relation?.$relationship.navigateTo ?? null

    const navigateTo = relationNavigateTo && relationNavigateTo !== this.view.id
      ? relationNavigateTo as aux.StrictViewId<A>
      : pipe(
        relationships,
        map(r => r.$relationship.navigateTo as aux.StrictViewId<A>),
        filter(isTruthy),
        filter(v => v !== this.view.id),
        unique(),
        only(),
      )

    const commonProperties = pipe(
      relationships,
      reduce((acc, { title, $relationship: r }) => {
        isTruthy(title) && acc.title.add(title)
        isTruthy(r.color) && acc.color.add(r.color)
        isTruthy(r.line) && acc.line.add(r.line)
        return acc
      }, {
        color: new Set<Color>(),
        line: new Set<RelationshipLineType>(),
        title: new Set<string>(),
      }),
    )

    return {
      tags,
      relations,
      navigateTo: navigateTo ?? null,
      title: only([...commonProperties.title]) ?? null,
      color: only([...commonProperties.color]) ?? null,
      line: only([...commonProperties.line]) ?? null,
    }
  }
}
export function computeDynamicView<M extends AnyAux>(
  model: LikeC4Model<M>,
  view: DynamicView<M>,
): ComputedDynamicView<M> {
  return new DynamicViewCompute(model, view).compute()
}
