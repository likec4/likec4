import { difference, filter, findLast, map, pipe } from 'remeda'
import { invariant, nonexhaustive } from '../../errors'
import { LikeC4Model } from '../../model'
import { ConnectionModel } from '../../model/connection/model/ConnectionModel'
import type { RelationshipModel } from '../../model/RelationModel'
import type { AnyAux } from '../../model/types'
import type {
  ComputedElementView,
  ElementPredicateExpression,
  ElementView,
  RelationPredicateExpression,
  ViewRule
} from '../../types'
import { isViewRuleAutoLayout, isViewRuleGroup, isViewRulePredicate, whereOperatorAsPredicate } from '../../types'
import * as Expr from '../../types/expression'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyCustomRelationProperties } from '../utils/applyCustomRelationProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildElementNotations } from '../utils/buildElementNotations'
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges'
import { resolveGlobalRulesInElementView } from '../utils/resolve-global-rules'
import { topologicalSort } from '../utils/topological-sort'
import { calcViewLayoutHash } from '../utils/view-hash'
import { type Connection, type Elem, type PredicateCtx } from './_types'
import { cleanConnections } from './clean-connections'
import { Memory, type Stage } from './memory'
import { ActiveGroupMemory } from './memory/memory'
import { ExpandedElementPredicate } from './predicates/element-expand'
import { ElementKindOrTagPredicate } from './predicates/element-kind-tag'
import { ElementRefPredicate } from './predicates/element-ref'
import { DirectRelationExprPredicate } from './predicates/relation-direct'
import { IncomingExprPredicate } from './predicates/relation-in'
import { InOutRelationPredicate } from './predicates/relation-in-out'
import { OutgoingExprPredicate } from './predicates/relation-out'
import { WildcardPredicate } from './predicates/wildcard'
import { buildNodes, NoFilter, NoWhere, toComputedEdges } from './utils'

function processElementPredicate(
  // ...args:
  //   | [expr: ElementPredicateExpression, op: 'include', IncludePredicateCtx<ElementPredicateExpression>]
  //   | [expr: ElementPredicateExpression, op: 'exclude', ExcludePredicateCtx<ElementPredicateExpression>]
  expr: ElementPredicateExpression,
  op: 'include' | 'exclude',
  ctx: Omit<PredicateCtx<RelationPredicateExpression>, 'expr'>
): Stage {
  switch (true) {
    case Expr.isCustomElement(expr): {
      if (op === 'include') {
        return processElementPredicate(expr.custom.expr, op, ctx)
      }
      return ctx.stage
    }
    case Expr.isElementWhere(expr): {
      const where = whereOperatorAsPredicate(expr.where.condition)
      const filterWhere = filter<Elem>(where)
      return processElementPredicate(expr.where.expr, op, { ...ctx, where, filterWhere } as any)
    }
    case Expr.isExpandedElementExpr(expr): {
      // if (op === 'include') {
      //   return ExpandedElementPredicate[op]({ ...ctx, expr }) ?? ctx.stage
      // }
      return ExpandedElementPredicate[op]({ ...ctx, expr } as any) ?? ctx.stage
    }
    case Expr.isElementRef(expr): {
      // return callPredicate(ElementRefPredicate, op, { ...ctx, expr }) ?? ctx.stage
      return ElementRefPredicate[op]({ ...ctx, expr } as any) ?? ctx.stage
    }
    case Expr.isWildcard(expr):
      return WildcardPredicate[op]({ ...ctx, expr } as any) ?? ctx.stage
    case Expr.isElementKindExpr(expr):
    case Expr.isElementTagExpr(expr):
      return ElementKindOrTagPredicate[op]({ ...ctx, expr } as any) ?? ctx.stage
    default:
      nonexhaustive(expr)
  }
}
function processRelationtPredicate(
  expr: RelationPredicateExpression,
  op: 'include' | 'exclude',
  ctx: Omit<PredicateCtx<RelationPredicateExpression>, 'expr'>
): Stage {
  switch (true) {
    case Expr.isCustomRelationExpr(expr): {
      if (op === 'include') {
        return processRelationtPredicate(expr.customRelation.relation, op, ctx)
      }
      return ctx.stage
    }
    case Expr.isRelationWhere(expr): {
      const where = whereOperatorAsPredicate(expr.where.condition)
      const filterRelations = (relations: ReadonlySet<RelationshipModel>) => {
        return new Set(filter([...relations], where))
      }
      const filterWhere = (connections: ReadonlyArray<Connection>) => {
        return pipe(
          connections,
          map(c => new ConnectionModel(c.source, c.target, filterRelations(c.relations))),
          filter(c => c.nonEmpty())
        )
      }
      return processRelationtPredicate(expr.where.expr, op, {
        ...ctx,
        where,
        filterWhere
      })
    }
    case Expr.isInOut(expr): {
      return InOutRelationPredicate[op]({ ...ctx, expr } as any) ?? ctx.stage
    }
    case Expr.isRelation(expr): {
      return DirectRelationExprPredicate[op]({ ...ctx, expr } as any) ?? ctx.stage
    }
    case Expr.isOutgoing(expr): {
      return OutgoingExprPredicate[op]({ ...ctx, expr } as any) ?? ctx.stage
    }
    case Expr.isIncoming(expr): {
      return IncomingExprPredicate[op]({ ...ctx, expr } as any) ?? ctx.stage
    }
    default:
      nonexhaustive(expr)
  }
}

function processPredicates<M extends AnyAux>(
  model: LikeC4Model<M>,
  memory: Memory,
  scope: Elem | null,
  rules: ViewRule[]
): Memory {
  const ctx = {
    model,
    scope,
    where: NoWhere,
    filterWhere: NoFilter
  }
  for (const rule of rules) {
    if (isViewRuleGroup(rule)) {
      const groupMemory = ActiveGroupMemory.enter(memory, rule)
      memory = processPredicates(model, groupMemory, scope, rule.groupRules)
      invariant(memory instanceof ActiveGroupMemory, 'processPredicates must return ActiveGroupMemory')
      memory = memory.leave()
      continue
    }
    if (isViewRulePredicate(rule)) {
      const op = 'include' in rule ? 'include' : 'exclude'
      const exprs = rule.include ?? rule.exclude
      for (const expr of exprs) {
        let stage = op === 'include' ? memory.stageInclude() : memory.stageExclude()
        switch (true) {
          case Expr.isElementPredicateExpr(expr):
            stage = processElementPredicate(expr, op, {
              ...ctx,
              stage,
              memory
            } as any) ?? stage
            break
          case Expr.isRelationPredicateExpr(expr):
            stage = processRelationtPredicate(expr, op, {
              ...ctx,
              stage,
              memory
            }) ?? stage
            break
          default:
            nonexhaustive(expr)
        }
        memory = stage.commit()
      }
    }
  }
  return memory
}

export function computeElementView<M extends AnyAux>(
  likec4model: LikeC4Model<M>,
  {
    docUri: _docUri, // exclude docUri
    rules, // exclude rules
    ...view
  }: ElementView
): ComputedElementView<M['ViewId']> {
  rules = resolveGlobalRulesInElementView(rules, likec4model.globals())
  const scope = view.viewOf ? likec4model.element(view.viewOf) : null
  let memory = cleanConnections(
    processPredicates<M>(
      likec4model,
      Memory.empty(),
      scope,
      rules
    )
  )
  if (memory.isEmpty() && scope) {
    memory = memory.update({
      final: new Set([scope])
    })
  }
  memory = assignElementsToGroups(memory)

  const nodesMap = buildNodes(memory)

  const computedEdges = toComputedEdges(memory.connections)

  linkNodesWithEdges(nodesMap, computedEdges)

  const sorted = topologicalSort({
    nodes: [...nodesMap.values()],
    edges: computedEdges
  })

  const nodes = applyCustomElementProperties(
    rules,
    applyViewRuleStyles(
      rules,
      sorted.nodes
    )
  )

  const autoLayoutRule = findLast(rules, isViewRuleAutoLayout)

  const elementNotations = buildElementNotations(nodes)

  return calcViewLayoutHash({
    ...view,
    autoLayout: {
      direction: autoLayoutRule?.direction ?? 'TB',
      ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
      ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep })
    },
    edges: applyCustomRelationProperties(rules, nodes, sorted.edges),
    nodes: map(nodes, n => {
      // omit notation
      delete n.notation
      if (n.icon === 'none') {
        delete n.icon
      }
      return n
    }),
    ...(elementNotations.length > 0 && {
      notation: {
        elements: elementNotations
      }
    })
  })
}

/**
 * Clean up group.explicits and group.implicits
 */
function assignElementsToGroups(memory: Memory) {
  if (memory.groups.length === 0) {
    return memory
  }
  const state = memory.mutableState()
  const unprocessed = new Set<Elem>(difference(
    [...state.final],
    [...state.rootGroup.explicits]
  ))
  // Step 1 - Process explicits
  let groups = state.groups.map(g => {
    const explicits = new Set<Elem>()
    for (const el of g.explicits) {
      if (unprocessed.delete(el)) {
        explicits.add(el)
      }
    }
    return g.update({ explicits })
  })
  // Step 2 - Process implicits (make them explicits)
  groups = groups.map(group => {
    const explicits = new Set(group.explicits)
    for (const el of group.implicits) {
      if (unprocessed.delete(el)) {
        explicits.add(el)
      }
    }
    return group.update({ explicits, implicits: new Set() })
  })
  return memory.update({ groups })
}
