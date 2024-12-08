import { filter, hasAtLeast, isEmpty, isTruthy, map, only, pipe, unique } from 'remeda'
import { invariant, nonexhaustive } from '../../errors'
import type { LikeC4DeploymentModel } from '../../model'
import type { DeploymentConnectionModel } from '../../model/connection/deployment'
import type { AnyAux } from '../../model/types'
import {
  type ComputedEdge,
  type ComputedNode,
  DefaultArrowType,
  DeploymentElementExpression,
  type DeploymentNodeKind,
  type DeploymentViewRule,
  type Fqn,
  isViewRuleStyle,
  type NonEmptyArray,
  type Tag
} from '../../types'
import { isAncestor, parentFqn } from '../../utils'
import { applyViewRuleStyle } from '../utils/applyViewRuleStyles'
import { buildComputedNodes, type ComputedNodeSource } from '../utils/buildComputedNodes'
import { uniqueTags } from '../utils/uniqueTags'
import type { Elem } from './_types'
import { type Memory, MutableMemory } from './Memory'

type Predicate<T> = (x: T) => boolean

export function resolveElements(model: LikeC4DeploymentModel, expr: DeploymentElementExpression.Ref) {
  const ref = model.element(expr.ref)
  if (ref.isDeploymentNode()) {
    if (expr.selector === 'children') {
      return [...ref.children()]
    }
    if (expr.selector === 'expanded') {
      return [
        ref,
        ...ref.children()
      ]
    }
    if (expr.selector === 'descendants') {
      return [...ref.descendants()]
    }
  }
  return [ref]
}

export function deploymentExpressionToPredicate<T extends { id: string }>(
  target: DeploymentElementExpression
): Predicate<T> {
  if (DeploymentElementExpression.isWildcard(target)) {
    return () => true
  }
  if (DeploymentElementExpression.isRef(target)) {
    const fqn = target.ref.id
    if (target.selector === 'expanded') {
      const fqnWithDot = fqn + '.'
      return n => n.id === fqn || n.id.startsWith(fqnWithDot)
    }
    if (target.selector === 'descendants') {
      const fqnWithDot = fqn + '.'
      return n => n.id.startsWith(fqnWithDot)
    }
    if (target.selector === 'children') {
      return n => parentFqn(n.id) === fqn
    }
    return n => n.id === fqn
  }
  nonexhaustive(target)
}

export function toNodeSource(el: Elem): ComputedNodeSource {
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

export function toComputedEdges<M extends AnyAux>(
  connections: ReadonlyArray<DeploymentConnectionModel<M>>
): ComputedEdge[] {
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

export function buildNodes(memory: Memory): ReadonlyMap<Fqn, ComputedNode> {
  // typecast to MutableMemory
  invariant(memory instanceof MutableMemory, 'Expected MutableMemory')
  return buildComputedNodes([...memory.finalElements].map(toNodeSource))
}

export function applyDeploymentViewRuleStyles(rules: DeploymentViewRule[], nodes: ComputedNode[]) {
  for (const rule of rules) {
    if (!isViewRuleStyle(rule) || rule.targets.length === 0) {
      continue
    }
    const predicates = rule.targets.map(deploymentExpressionToPredicate)
    applyViewRuleStyle(rule, predicates, nodes)
  }
  return nodes
}
