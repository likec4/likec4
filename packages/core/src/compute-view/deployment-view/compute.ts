import { findLast, map } from 'remeda'
import { type DeploymentConnectionModel, type LikeC4DeploymentModel, LikeC4Model } from '../../model'
import type { AnyAux, DeploymentViewRule } from '../../types'
import {
  type ComputedDeploymentView,
  type ParsedDeploymentView as DeploymentView,
  _stage,
  _type,
  isViewRuleAutoLayout,
  isViewRulePredicate,
  RelationExpr,
} from '../../types'
import { buildElementNotations } from '../utils/buildElementNotations'
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges'
import { createRelationExpressionToPredicates } from '../utils/relationExpressionToPredicates'
import type { ExpandableRelation } from '../utils/relationExpressionToPredicates'
import { topologicalSort } from '../utils/topological-sort'
import { calcViewLayoutHash } from '../utils/view-hash'
import { Memory } from './memory'
import { predicateToPatch } from './predicates'
import { StageFinal } from './stages/stage-final'
import { applyDeploymentViewRuleStyles, buildNodes, deploymentExpressionToPredicate, toComputedEdges } from './utils'

// deploymentExpressionToPredicate uses FqnExpr (not ModelFqnExpr) — the `as any` bridge
// is needed because createRelationExpressionToPredicates types the builder for ModelFqnExpr.
// The runtime behavior is safe: both builders return (node: { id: string }) => boolean.
const deploymentRelationExprToPredicate = createRelationExpressionToPredicates(
  deploymentExpressionToPredicate as any,
)

function buildExpandPredicate<A extends AnyAux>(
  model: LikeC4Model<any>,
  rules: DeploymentViewRule<A>[],
): ((rel: ExpandableRelation) => boolean) | undefined {
  const multipleRules: RelationExpr.Custom<A>[] = []
  const multipleFalseRules: RelationExpr.Custom<A>[] = []

  for (const rule of rules) {
    if (isViewRulePredicate(rule) && 'include' in rule) {
      for (const expr of rule.include) {
        if (RelationExpr.isCustom(expr)) {
          if (expr.customRelation.multiple === true) {
            multipleRules.push(expr)
          } else if (expr.customRelation.multiple === false) {
            multipleFalseRules.push(expr)
          }
        }
      }
    }
  }

  const multipleKinds = new Set<string>()
  const relSpecs = model.specification.relationships
  for (const kind of Object.keys(relSpecs)) {
    const spec = relSpecs[kind as keyof typeof relSpecs] as any
    // The spec may have `multiple` nested under `style` (buildModel.ts) or flat (builder)
    const style = spec?.style ?? spec
    if (style?.multiple) {
      multipleKinds.add(kind)
    }
  }

  if (multipleRules.length === 0 && multipleFalseRules.length === 0 && multipleKinds.size === 0) {
    return undefined
  }

  const rulePredicates = multipleRules.map(r => ({
    pred: deploymentRelationExprToPredicate(r.customRelation.expr),
  }))
  const falseRulePredicates = multipleFalseRules.map(r => ({
    pred: deploymentRelationExprToPredicate(r.customRelation.expr),
  }))

  return (rel: ExpandableRelation) => {
    // Resolve source/target properties for deployment relation endpoints.
    // NestedElementOfDeployedInstanceModel lacks tags/kind/metadata,
    // so reach through to the instance's element.
    const resolveEndpoint = (ep: any) => {
      if (ep && typeof ep === 'object') {
        if ('tags' in ep && 'kind' in ep && 'metadata' in ep) {
          return ep
        }
        if (ep.instance && ep.element) {
          return {
            id: ep.id,
            tags: ep.instance.tags,
            kind: ep.element.kind,
            metadata: ep.instance.metadata,
          }
        }
      }
      return ep ?? {}
    }

    if (falseRulePredicates.length > 0) {
      const source = resolveEndpoint(rel.source)
      const target = resolveEndpoint(rel.target)
      for (const { pred } of falseRulePredicates) {
        if (
          pred({
            source: source as any,
            target: target as any,
            kind: rel.kind as any,
            tags: rel.tags as any,
            metadata: rel.metadata as any,
          })
        ) {
          return false
        }
      }
    }

    if (multipleKinds.size > 0) {
      const kind = rel.kind
      if (kind && multipleKinds.has(kind)) {
        return true
      }
    }

    if (rulePredicates.length > 0) {
      const source = resolveEndpoint(rel.source)
      const target = resolveEndpoint(rel.target)
      for (const { pred } of rulePredicates) {
        if (
          pred({
            source: source as any,
            target: target as any,
            kind: rel.kind as any,
            tags: rel.tags as any,
            metadata: rel.metadata as any,
          })
        ) {
          return true
        }
      }
    }

    return false
  }
}

export function processPredicates(
  model: LikeC4DeploymentModel<any>,
  rules: DeploymentViewRule<any>[],
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
  }: DeploymentView<NoInfer<M>>,
): ComputedDeploymentView<M> {
  const memory = processPredicates(likec4model.deployment, rules)

  const nodesMap = buildNodes(likec4model, memory)

  const expandPredicate = buildExpandPredicate(likec4model, rules)

  const computedEdges = toComputedEdges(
    memory.connections as unknown as DeploymentConnectionModel<M>[],
    expandPredicate,
  )

  linkNodesWithEdges(nodesMap, computedEdges)

  const sorted = topologicalSort({
    nodes: nodesMap,
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
    [_stage]: 'computed',
    [_type]: 'deployment',
    autoLayout: {
      direction: autoLayoutRule?.direction ?? 'TB',
      ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
      ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep }),
    },
    edges: sorted.edges,
    nodes: map(nodes, n => {
      if (n.icon === 'none') {
        delete n.icon
      }
      return n
    }),
    ...(elementNotations.length > 0 && {
      notation: {
        nodes: elementNotations,
      },
    }),
  })
}
