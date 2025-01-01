import { findLast, map } from 'remeda'
import { type LikeC4DeploymentModel, LikeC4Model } from '../../model'
import type { AnyAux } from '../../model/types'
import type { DeploymentViewRule } from '../../types'
import {
  type ComputedDeploymentView,
  type DeploymentView,
  isViewRuleAutoLayout,
  isViewRulePredicate
} from '../../types'
import { buildElementNotations } from '../utils/buildElementNotations'
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges'
import { topologicalSort } from '../utils/topological-sort'
import { calcViewLayoutHash } from '../utils/view-hash'
import { applyDeploymentViewRuleStyles, buildNodes, toComputedEdges } from './utils'
import { predicateToPatch } from './predicates'
import { Memory, StageExclude, StageInclude } from './memory'
import { StageFinal } from './stages/stage-final'

export function processPredicates<M extends AnyAux>(
  model: LikeC4DeploymentModel<M>,
  rules: DeploymentViewRule[]
) {
  let memory = Memory.empty()

  for (const rule of rules) {
    if (isViewRulePredicate(rule)) {
      const op = 'include' in rule ? 'include' : 'exclude'
      const exprs = rule.include ?? rule.exclude
      for (const expr of exprs) {
        let stage = op === 'include' ? memory.stageInclude(expr) : memory.stageExclude(expr)
        const ctx = { expr, model, stage, memory, where: null }
        stage = predicateToPatch(op, ctx) ?? stage
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
  }: DeploymentView
): ComputedDeploymentView<M['ViewId']> {
  const memory = processPredicates<M>(likec4model.deployment, rules)

  const nodesMap = buildNodes(memory)

  const computedEdges = toComputedEdges(memory.connections)

  linkNodesWithEdges(nodesMap, computedEdges)

  const sorted = topologicalSort({
    nodes: nodesMap,
    edges: computedEdges
  })

  const nodes = applyDeploymentViewRuleStyles(
    rules,
    sorted.nodes
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
        elements: elementNotations
      }
    })
  })
}
