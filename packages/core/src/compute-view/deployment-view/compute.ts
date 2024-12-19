import { findLast, map } from 'remeda'
import { nonexhaustive } from '../../errors'
import { type LikeC4DeploymentModel, LikeC4Model } from '../../model'
import type { AnyAux } from '../../model/types'
import type { DeploymentViewRule } from '../../types'
import {
  type ComputedDeploymentView,
  type DeploymentView,
  FqnExpr,
  isViewRuleAutoLayout,
  isViewRulePredicate,
} from '../../types'
import { RelationExpr } from '../../types/expression-v2'
import { buildElementNotations } from '../utils/buildElementNotations'
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges'
import { topologicalSort } from '../utils/topological-sort'
import { calcViewLayoutHash } from '../utils/view-hash'
import { Memory } from './memory'
import { DeploymentRefPredicate } from './predicates/elements'
import { DirectRelationPredicate } from './predicates/relation-direct'
import { InOutRelationPredicate } from './predicates/relation-in-out'
import { IncomingRelationPredicate } from './predicates/relation-incoming'
import { OutgoingRelationPredicate } from './predicates/relation-outgoing'
import { WildcardPredicate } from './predicates/wildcard'
import { StageFinal } from './stages/stage-final'
import { applyDeploymentViewRuleStyles, buildNodes, toComputedEdges } from './utils'

export function processPredicates<M extends AnyAux>(
  model: LikeC4DeploymentModel<M>,
  rules: DeploymentViewRule[],
) {
  let memory = Memory.empty()

  for (const rule of rules) {
    if (isViewRulePredicate(rule)) {
      const op = 'include' in rule ? 'include' : 'exclude'
      const exprs = rule.include ?? rule.exclude
      for (const expr of exprs) {
        let stage = op === 'include' ? memory.stageInclude(expr) : memory.stageExclude(expr)
        const ctx = { model, stage, memory }
        switch (true) {
          case FqnExpr.isModelRef(expr):
            // Ignore model refs in deployment view
            break
          case FqnExpr.isDeploymentRef(expr):
            stage = DeploymentRefPredicate[op]({ ...ctx, expr } as any) ?? stage
            break
          case FqnExpr.isWildcard(expr):
            stage = WildcardPredicate[op]({ ...ctx, expr } as any) ?? stage
            break
          case RelationExpr.isDirect(expr):
            stage = DirectRelationPredicate[op]({ ...ctx, expr } as any) ?? stage
            break
          case RelationExpr.isInOut(expr):
            stage = InOutRelationPredicate[op]({ ...ctx, expr } as any) ?? stage
            break
          case RelationExpr.isOutgoing(expr):
            stage = OutgoingRelationPredicate[op]({ ...ctx, expr } as any) ?? stage
            break
          case RelationExpr.isIncoming(expr):
            stage = IncomingRelationPredicate[op]({ ...ctx, expr } as any) ?? stage
            break
          default:
            nonexhaustive(expr)
        }
        memory = stage.commit()
      }
    }
  }
  return StageFinal.for(memory).commit()
}

export function computeDeploymentView<M extends AnyAux>(
  likec4model: LikeC4Model<M>,
  {
    docUri: _docUri, // exclude docUri
    rules, // exclude rules
    ...view
  }: DeploymentView,
): ComputedDeploymentView<M['ViewId']> {
  let memory = processPredicates<M>(likec4model.deployment, rules)

  const nodesMap = buildNodes(memory)

  const computedEdges = toComputedEdges(memory.connections)

  linkNodesWithEdges(nodesMap, computedEdges)

  const sorted = topologicalSort({
    nodes: [...nodesMap.values()],
    edges: computedEdges,
  })

  const nodes = applyDeploymentViewRuleStyles(
    rules,
    sorted.nodes,
  )

  const autoLayoutRule = findLast(rules, isViewRuleAutoLayout)

  const elementNotations = buildElementNotations(nodes)

  return calcViewLayoutHash({
    ...view,
    autoLayout: {
      direction: autoLayoutRule?.direction ?? 'TB',
      ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
      ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep }),
    },
    edges: sorted.edges,
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
        elements: elementNotations,
      },
    }),
  })
}
