import { filter, findLast, hasAtLeast, isEmpty, isTruthy, map, only, pipe, unique } from 'remeda'
import { invariant, nonexhaustive, nonNullable } from '../../errors'
import { type LikeC4DeploymentModel, LikeC4Model } from '../../model'
import { DeploymentConnectionModel } from '../../model/connection/DeploymentConnectionModel'
import type { AnyAux } from '../../model/types'
import type { ComputedNode, DeploymentNodeKind, DeploymentViewRule, Fqn, NonEmptyArray, Tag } from '../../types'
import {
  type ComputedDeploymentView,
  type ComputedEdge,
  DefaultArrowType,
  DeploymentElementExpression,
  DeploymentRelationExpression,
  type DeploymentView,
  isViewRuleAutoLayout,
  isViewRulePredicate
} from '../../types'
import { applyDeploymentViewRuleStyles } from '../utils/applyViewRuleStyles'
import type { ComputedNodeSource } from '../utils/buildComputedNodes'
import { buildComputedNodes } from '../utils/buildComputedNodes'
import { linkNodeEdges } from '../utils/linkNodeEdges'
import { topologicalSort } from '../utils/topologicalSort'
import { uniqueTags } from '../utils/uniqueTags'
import { calcViewLayoutHash } from '../utils/view-hash'
import type { Elem } from './_types'
import { cleanConnections } from './clean-connections'
import { type Memory, MutableMemory, type Patch } from './Memory'
import { DeploymentRefPredicate } from './predicates/element'
import { DirectRelationPredicate } from './predicates/relation-direct'
import { InOutRelationPredicate } from './predicates/relation-in-out'
import { IncomingRelationPredicate } from './predicates/relation-incoming'
import { OutgoingRelationPredicate } from './predicates/relation-outgoing'
import { WildcardPredicate } from './predicates/wildcard'
import { Stage } from './Stage'

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

function toNodeSource(el: Elem): ComputedNodeSource {
  if (el.isDeploymentNode()) {
    const onlyOneInstance = el.onlyOneInstance()
    const {
      icon,
      color,
      shape,
      ...style
    } = el.$node.style ?? {}
    return {
      ...onlyOneInstance && toNodeSource(onlyOneInstance),
      ...el.$node,
      ...icon && { icon },
      ...color && { color },
      ...shape && { shape },
      style: {
        ...style
      },
      deploymentRef: 1
    }
  }
  invariant(el.isInstance(), 'Expected Instance')
  const instance = el.$instance
  const element = el.element.$element

  const icon = instance.style?.icon ?? element.icon
  const color = instance.style?.color ?? element.color
  const shape = instance.style?.shape ?? element.shape

  const links = [
    ...(element.links ?? []),
    ...(instance.links ?? [])
  ]

  const metadata = {
    ...element.metadata,
    ...instance.metadata
  }

  const notation = instance.notation ?? element.notation

  return {
    id: el.id,
    kind: 'instance' as DeploymentNodeKind,
    title: instance.title ?? element.title,
    description: instance.description ?? element.description,
    technology: instance.technology ?? element.technology,
    tags: uniqueTags([element, instance]) as NonEmptyArray<Tag>,
    links: hasAtLeast(links, 1) ? links : null,
    ...icon && { icon },
    ...color && { color },
    ...shape && { shape },
    style: {
      ...element.style,
      ...instance.style
    },
    deploymentRef: el.id === instance.id ? 1 : instance.id,
    modelRef: el.id === element.id ? 1 : element.id,
    ...notation && { notation },
    ...!isEmpty(metadata) && ({ metadata })
  }
}

function toComputedEdges<M extends AnyAux>(connections: ReadonlyArray<DeploymentConnectionModel<M>>): ComputedEdge[] {
  return connections.reduce((acc, e) => {
    // invariant(hasAtLeast(e.relations, 1), 'Edge must have at least one relation')
    // const relations = sort([...e.relations], compareRelations)
    const relations = [...e.relations.model].map(r => r.$relationship)
    const source = e.source.id
    const target = e.target.id

    const tags = uniqueTags(relations)
    // Most closest relation
    const relation = only(relations) // || relations.find(r => r.source === source && r.target === target)

    // This edge represents mutliple relations
    // We use label if only it is the same for all relations
    const title = isTruthy(relation?.title) ? relation.title : pipe(
      relations,
      map(r => r.title),
      filter(isTruthy),
      unique(),
      only()
    )

    const navigateTo = relation && 'navigateTo' in relation ? relation.navigateTo : pipe(
      relations,
      map(r => 'navigateTo' in r ? r.navigateTo : null),
      filter(isTruthy),
      unique(),
      only()
    )

    const edge: ComputedEdge = {
      id: e.id,
      parent: e.boundary?.id ?? null,
      source,
      target,
      label: title ?? null,
      relations: relations.map(r => r.id as M['RelationId']),
      ...tags && { tags: tags as NonEmptyArray<Tag> },
      ...navigateTo && { navigateTo }
    }

    // If exists same edge but in opposite direction
    const existing = acc.find(e => e.source === target && e.target === source)
    if (existing && edge.label === existing.label && edge.relations.length === existing.relations.length) {
      existing.head = DefaultArrowType
      existing.tail = DefaultArrowType
      return acc
    }

    acc.push(edge)
    return acc
  }, [] as ComputedEdge[])
}

function buildNodes(memory: Memory): ReadonlyMap<Fqn, ComputedNode> {
  // typecast to MutableMemory
  invariant(memory instanceof MutableMemory, 'Expected MutableMemory')
  return buildComputedNodes([...memory.finalElements].map(toNodeSource))
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

  const edges = toComputedEdges(memory.connections)

  linkNodeEdges(nodesMap, edges)

  const sorted = topologicalSort({
    nodes: [...nodesMap.values()],
    edges
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
