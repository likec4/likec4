import { findLast } from 'remeda'
import { nonexhaustive } from '../../errors'
import { type LikeC4DeploymentModel, LikeC4Model } from '../../model'
import type { AnyAux } from '../../model/types'
import type { DeploymentViewRule } from '../../types'
import {
  type ComputedDeploymentView,
  DeploymentElementExpression,
  DeploymentRelationExpression,
  type DeploymentView,
  isViewRuleAutoLayout,
  isViewRulePredicate
} from '../../types'
import { linkNodeEdges } from '../utils/linkNodeEdges'
import { topologicalSort } from '../utils/topologicalSort'
import { calcViewLayoutHash } from '../utils/view-hash'
import { cleanConnections } from './clean-connections'
import { MutableMemory, type Patch } from './Memory'
import { DeploymentRefPredicate } from './predicates/deployment-ref'
import { DirectRelationPredicate } from './predicates/relation-direct'
import { InOutRelationPredicate } from './predicates/relation-in-out'
import { IncomingRelationPredicate } from './predicates/relation-incoming'
import { OutgoingRelationPredicate } from './predicates/relation-outgoing'
import { WildcardPredicate } from './predicates/wildcard'
import { Stage } from './Stage'
import { applyDeploymentViewRuleStyles, buildNodes, toComputedEdges } from './utils'

function processPredicates<M extends AnyAux>(
  model: LikeC4DeploymentModel<M>,
  rules: DeploymentViewRule[]
) {
  let memory = MutableMemory.empty()
  let stage: Stage | null = null

  for (const rule of rules) {
    if (isViewRulePredicate(rule)) {
      const op = 'include' in rule ? 'include' : 'exclude'
      const exprs = rule.include ?? rule.exclude
      for (const expr of exprs) {
        stage = new Stage(stage)
        const ctx = { model, stage, memory }
        let patch: Patch | undefined
        switch (true) {
          case DeploymentElementExpression.isRef(expr):
            patch = DeploymentRefPredicate[op](expr, ctx)
            break
          case DeploymentElementExpression.isWildcard(expr):
            patch = WildcardPredicate[op](expr, ctx)
            break
          case DeploymentRelationExpression.isDirect(expr):
            patch = DirectRelationPredicate[op](expr, ctx)
            break
          case DeploymentRelationExpression.isInOut(expr):
            patch = InOutRelationPredicate[op](expr, ctx)
            break
          case DeploymentRelationExpression.isOutgoing(expr):
            patch = OutgoingRelationPredicate[op](expr, ctx)
            break
          case DeploymentRelationExpression.isIncoming(expr):
            patch = IncomingRelationPredicate[op](expr, ctx)
            break
          default:
            nonexhaustive(expr)
        }
        patch ??= stage.patch()
        memory = patch(memory)
      }
    }
  }
  return cleanConnections(memory)
}

export function computeDeploymentView<M extends AnyAux>(
  likec4model: LikeC4Model<M>,
  {
    docUri: _docUri, // exclude docUri
    rules, // exclude rules
    ...view
  }: DeploymentView
): ComputedDeploymentView<M['ViewId']> {
  const memory = processPredicates<M>(likec4model.deployment, rules)

  const nodesMap = buildNodes(memory)

  const computedEdges = toComputedEdges(memory.connections)

  linkNodeEdges(nodesMap, computedEdges)

  const sorted = topologicalSort({
    nodes: [...nodesMap.values()],
    edges: computedEdges
  })

  const nodes = applyDeploymentViewRuleStyles(
    rules,
    sorted.nodes
  )

  const autoLayoutRule = findLast(rules, isViewRuleAutoLayout)

  return calcViewLayoutHash({
    ...view,
    autoLayout: {
      direction: autoLayoutRule?.direction ?? 'TB',
      ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
      ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep })
    },
    nodes,
    edges: sorted.edges
  })
}
