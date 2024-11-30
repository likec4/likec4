import { filter, hasAtLeast, isEmpty, isTruthy, map, only, pipe, unique } from 'remeda'
import { invariant } from '../../errors'
import { LikeC4Model } from '../../model'
import { mergeConnections } from '../../model/connection/deployment'
import { DeploymentConnectionModel } from '../../model/DeploymentConnectionModel'
import type { AnyAux } from '../../model/types'
import type { DeploymentNodeKind, NonEmptyArray, Tag } from '../../types'
import {
  type ComputedDeploymentView,
  type ComputedEdge,
  DefaultArrowType,
  DeploymentElementExpression,
  type DeploymentView,
  isViewRuleAutoLayout,
  isViewRulePredicate
} from '../../types'
import { applyDeploymentViewRuleStyles } from '../utils/applyViewRuleStyles'
import type { ComputedNodeSource } from '../utils/buildComputedNodes'
import { buildComputedNodes } from '../utils/buildComputedNodes'
import { topologicalSort } from '../utils/topologicalSort'
import { uniqueTags } from '../utils/uniqueTags'
import { updateNodeInOutEdges } from '../utils/update-node-inout-edges'
import { calcViewLayoutHash } from '../utils/view-hash'
import type { Elem } from './_types'
import { cleanCrossBoundaryConnections } from './clean-cross-boundary'
import { MutableMemory, type Patch } from './Memory'
import { excludeDeploymentRef, includeDeploymentRef } from './predicates/deployment-ref'
import { excludeWildcard, includeWildcard } from './predicates/wildcard'
import { Stage } from './Stage'

export function computeDeploymentView<M extends AnyAux>(
  likec4model: LikeC4Model<M>,
  {
    docUri: _docUri, // exclude docUri
    rules, // exclude rules
    ...view
  }: DeploymentView
): ComputedDeploymentView<M['ViewId']> {
  const model = likec4model.deployment
  let memory = new MutableMemory()
  let stage: Stage | null = null

  for (const rule of rules) {
    if (isViewRulePredicate(rule)) {
      const isInclude = 'include' in rule
      const exprs = rule.include ?? rule.exclude
      for (const expr of exprs) {
        stage = new Stage(stage)
        const ctx = { model, stage, memory }
        let patch: Patch | undefined
        switch (true) {
          case DeploymentElementExpression.isRef(expr):
            patch = isInclude ? includeDeploymentRef({ ...ctx, expr }) : excludeDeploymentRef({ ...ctx, expr })
            break
          case DeploymentElementExpression.isWildcard(expr):
            patch = isInclude ? includeWildcard({ ...ctx, expr }) : excludeWildcard({ ...ctx, expr })
            break
        }
        patch ??= stage.patch()
        memory = patch(memory)
      }
    }
  }

  // Temporary workaround - transform deployment elements to model elements
  // Because the rest of the code expects model elements and we want to minimize changes for now
  const nodesMap = buildComputedNodes([...memory.finalElements].map(toNodeSource))

  const edges = pipe(
    memory.connections,
    // Keep only connections between leafs
    filter(c => {
      const source = nodesMap.get(c.source.id)
      const target = nodesMap.get(c.target.id)
      return source?.children.length === 0 && target?.children.length === 0
    }),
    mergeConnections,
    cleanCrossBoundaryConnections,
    toComputedEdges
  )

  updateNodeInOutEdges(nodesMap, edges)

  const nodes = applyDeploymentViewRuleStyles(
    rules,
    topologicalSort({
      nodes: [...nodesMap.values()],
      edges
    })
  )

  const autoLayoutRule = rules.findLast(isViewRuleAutoLayout)

  return calcViewLayoutHash({
    ...view,
    autoLayout: {
      direction: autoLayoutRule?.direction ?? 'TB',
      ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
      ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep })
    },
    nodes,
    edges
  })
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
