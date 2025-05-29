import { filter, findLast, flatMap, hasAtLeast, isTruthy, map, only, pipe, reduce, unique } from 'remeda'
import { nonNullable } from '../../errors'
import type { LikeC4Model } from '../../model'
import { findConnection } from '../../model/connection/model'
import type { ElementModel } from '../../model/ElementModel'
import type { Any, AnyAux, Aux } from '../../types'
import {
  type Color,
  type ComputedDynamicView,
  type ComputedEdge,
  type DynamicView,
  type DynamicViewStep,
  type NonEmptyArray,
  type RelationshipArrowType,
  type RelationshipLineType,
  type StepEdgeId,
  DefaultArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  isDynamicViewParallelSteps,
  isViewRuleAutoLayout,
  isViewRulePredicate,
  stepEdgeId,
} from '../../types'
import { ancestorsFqn, commonAncestor, parentFqn } from '../../utils/fqn'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputedNodesFromElements } from '../utils/buildComputedNodes'
import { buildElementNotations } from '../utils/buildElementNotations'
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate'
import { resolveGlobalRulesInDynamicView } from '../utils/resolve-global-rules'
import { calcViewLayoutHash } from '../utils/view-hash'

type Element<A extends AnyAux = Any> = ElementModel<A>

namespace DynamicViewCompute {
  export interface Step<A extends AnyAux = Any> {
    id: StepEdgeId
    source: Element<A>
    target: Element<A>
    title: string | null
    description?: string
    technology?: string
    color?: Color
    line?: RelationshipLineType
    head?: RelationshipArrowType
    tail?: RelationshipArrowType
    relations: Aux.Strict.RelationId<A>[]
    isBackward: boolean
    navigateTo?: Aux.Strict.ViewId<A>
    tags?: Aux.Tags<A>
  }
}

class DynamicViewCompute<A extends AnyAux = Any> {
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

    const rules = resolveGlobalRulesInDynamicView(_rules, this.model.globals())

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

    const elements = [...this.explicits].map(e => e.$element)
    const nodesMap = buildComputedNodesFromElements(elements)

    const edges = this.steps.map(({ id, source, target, relations, title, isBackward, ...step }) => {
      const sourceNode = nonNullable(nodesMap.get(source.id), `Source node ${source.id} not found`)
      const targetNode = nonNullable(nodesMap.get(target.id), `Target node ${target.id} not found`)
      const edge: ComputedEdge<A> = {
        id: id as unknown as Aux.Strict.EdgeId<A>,
        parent: commonAncestor(source.id, target.id),
        source: source.id,
        target: target.id,
        label: title,
        relations,
        color: DefaultRelationshipColor,
        line: DefaultLineStyle,
        head: DefaultArrowType,
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
        elements.map(e => nonNullable(nodesMap.get(e.id))),
      ),
    )

    const autoLayoutRule = findLast(rules, isViewRuleAutoLayout)

    const elementNotations = buildElementNotations(nodes)

    return calcViewLayoutHash({
      ...view,
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
      ...(elementNotations.length > 0 && {
        notation: {
          elements: elementNotations,
        },
      }),
    })
  }

  private findRelations(source: Element<A>, target: Element<A>): {
    title: string | null
    tags: Aux.Tags<A> | null
    relations: NonEmptyArray<Aux.Strict.RelationId<A>> | null
    navigateTo: Aux.Strict.ViewId<A> | null
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
    )
    const tags = hasAtLeast(alltags, 1) ? alltags : null
    const relations = hasAtLeast(relationships, 1) ? map(relationships, r => r.id) : null

    // Most closest relation
    const relation = only(relationships) || relationships.find(r => r.source === source && r.target === target)
    const relationNavigateTo = relation?.$relationship.navigateTo ?? null

    const navigateTo = relationNavigateTo && relationNavigateTo !== this.view.id
      ? relationNavigateTo as Aux.Strict.ViewId<A>
      : pipe(
        relationships,
        map(r => r.$relationship.navigateTo as Aux.Strict.ViewId<A>),
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
  view: DynamicView<NoInfer<M>>,
): ComputedDynamicView<M> {
  return new DynamicViewCompute(model, view).compute()
}
