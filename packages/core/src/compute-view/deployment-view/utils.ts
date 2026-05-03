import { anyPass, filter, hasAtLeast, isEmpty, omit, only, partition, pipe } from 'remeda'
import type { Writable } from 'type-fest'
import type {
  DeployedInstanceModel,
  DeploymentConnectionModel,
  DeploymentElementModel,
  DeploymentNodeModel,
  ElementModel,
  LikeC4DeploymentModel,
  LikeC4Model,
} from '../../model'
import { deploymentConnection } from '../../model'
import type { AnyAux, aux, ComputedEdge, ComputedNode, DeploymentViewRule, scalar, Unknown } from '../../types'
import { exact, FqnExpr, isViewRuleStyle, preferSummary } from '../../types'
import { invariant, nonexhaustive, parentFqn } from '../../utils'
import { stringHash } from '../../utils/string-hash'
import { applyViewRuleStyle } from '../utils/applyViewRuleStyles'
import type { ComputedNodeSource } from '../utils/buildComputedNodes'
import { buildComputedNodes } from '../utils/buildComputedNodes'
import { mergePropsFromRelationships } from '../utils/merge-props-from-relationships'
import type { ShouldExpandPredicate } from '../utils/relationExpressionToPredicates'
import type { Memory } from './_types'

export const { findConnection, findConnectionsBetween, findConnectionsWithin } = deploymentConnection

type Predicate<T> = (x: T) => boolean

export function resolveElements<A extends AnyAux>(
  model: LikeC4DeploymentModel<A>,
  expr: FqnExpr.DeploymentRef<A>,
): DeploymentElementModel<A>[] {
  const ref = model.element(expr.ref.deployment)
  if (ref.isDeploymentNode()) {
    if (expr.selector === 'children') {
      return [...ref.children()]
    }
    if (expr.selector === 'expanded') {
      return [ref, ...ref.children()]
    }
    if (expr.selector === 'descendants') {
      return [...ref.descendants()]
    }
  }
  return [ref]
}

export function resolveModelElements<A extends AnyAux>(
  model: LikeC4DeploymentModel<A>,
  expr: FqnExpr.ModelRef<A>,
): ElementModel<A>[] {
  const ref = model.$model.element(expr.ref.model)
  if (expr.selector === 'children') {
    return [...ref.children()]
  }
  if (expr.selector === 'expanded') {
    return [ref, ...ref.children()]
  }
  if (expr.selector === 'descendants') {
    return [...ref.descendants()]
  }
  return [ref]
}

export function deploymentExpressionToPredicate<
  A extends AnyAux,
  N extends { id: string | aux.DeploymentFqn<A>; modelRef?: aux.Fqn<A> | undefined },
>(
  target: FqnExpr<A>,
): Predicate<N> {
  if (FqnExpr.isWildcard(target)) {
    return () => true
  }
  if (FqnExpr.isElementTagExpr(target) || FqnExpr.isElementKindExpr(target)) {
    throw new Error('element kind and tag expressions are not supported in deployment view rules')
  }
  if (FqnExpr.isDeploymentRef(target)) {
    const fqn = target.ref.deployment
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
  if (FqnExpr.isModelRef(target)) {
    const fqn = target.ref.model
    if (target.selector === 'expanded') {
      const fqnWithDot = fqn + '.'
      return (n: N) => {
        const m = n.modelRef ?? null
        if (!m) {
          return true
        }
        return m === fqn || m.startsWith(fqnWithDot)
      }
    }
    if (target.selector === 'descendants') {
      const fqnWithDot = fqn + '.'
      return (n: N) => {
        const m = n.modelRef ?? null
        if (!m) {
          return true
        }
        return m.startsWith(fqnWithDot)
      }
    }
    if (target.selector === 'children') {
      return (n: N) => {
        const m = n.modelRef ?? null
        if (!m) {
          return true
        }
        return parentFqn(m) === fqn
      }
    }
    return (n: N) => {
      const m = n.modelRef ?? null
      if (!m) {
        return true
      }
      return m === fqn
    }
  }
  nonexhaustive(target)
}

function instanceSummary(model: DeployedInstanceModel<any>) {
  return preferSummary(model.$instance) ?? preferSummary(model.element.$element)
}

function deploymentNodeToNodeSource<A extends AnyAux>(
  el: DeploymentNodeModel<A>,
): ComputedNodeSource<A> {
  const id = el.id
  const onlyOneInstance = el.onlyOneInstance()

  return exact({
    id: id as scalar.NodeId,
    deploymentRef: id,
    title: el.title,
    kind: el.kind,
    technology: el.technology ?? undefined,
    links: hasAtLeast(el.links, 1) ? [...el.links] : undefined,
    notation: el.$node.notation ?? undefined,
    color: el.color,
    shape: el.shape,
    modelRef: onlyOneInstance?.element.id,
    icon: el.style.icon,
    description: preferSummary(el.$node) ?? undefined,
    tags: [...el.tags],
    style: omit(el.style, ['icon', 'shape', 'color']),
  })
}

function instanceToNodeSource<A extends AnyAux>(
  el: DeployedInstanceModel<A>,
): ComputedNodeSource<A> {
  const instance = el.$instance
  const element = el.element
  const { icon, color, shape, ...style } = el.style

  // Merge links from element and instance
  const links = [
    ...element.links,
    ...(instance.links ?? []),
  ]

  return exact({
    id: el.id as scalar.NodeId,
    kind: 'instance' as unknown as aux.DeploymentKind<A>,
    title: el.title,
    description: instanceSummary(el) ?? undefined,
    technology: el.technology ?? undefined,
    tags: [...el.tags],
    links: hasAtLeast(links, 1) ? links : undefined,
    icon,
    color,
    shape,
    style,
    deploymentRef: instance.id,
    modelRef: element.id,
    notation: instance.notation,
  })
}

function toNodeSource<A extends AnyAux>(
  el: DeploymentNodeModel<A> | DeployedInstanceModel<A>,
): ComputedNodeSource<A> {
  if (el.isInstance()) {
    return instanceToNodeSource(el)
  }
  return deploymentNodeToNodeSource(el)
}

const hashEdgeId = (source: scalar.NodeId, target: scalar.NodeId, relId: scalar.RelationId): scalar.EdgeId =>
  stringHash(`model:${source}:${target}:${relId}`) as scalar.EdgeId

function mergeBidirectionalEdges<A extends AnyAux>(edges: ComputedEdge<A>[]): ComputedEdge<A>[] {
  const toRemove = new Set<number>()
  for (let i = 0; i < edges.length; i++) {
    if (toRemove.has(i)) continue
    const edge = edges[i]!
    for (let j = i + 1; j < edges.length; j++) {
      if (toRemove.has(j)) continue
      const other = edges[j]!
      if (edge.source === other.target && edge.target === other.source && edge.label === other.label) {
        edge.dir = 'both'
        const head = edge.head ?? other.head
        if (head) {
          if (!edge.head) edge.head = head
          if (!edge.tail) edge.tail = head
        }
        if (other.color) {
          if (!edge.color) edge.color = other.color
        }
        if (other.line) {
          if (!edge.line) edge.line = other.line
        }
        toRemove.add(j)
        break
      }
    }
  }
  return toRemove.size > 0 ? edges.filter((_, i) => !toRemove.has(i)) : edges
}

export function toComputedEdges<A extends AnyAux>(
  connections: ReadonlyArray<DeploymentConnectionModel<A>>,
  shouldExpand?: ShouldExpandPredicate,
): ComputedEdge<A>[] {
  const expandedEdges: ComputedEdge<A>[] = []
  const nonExpandedEdges: ComputedEdge<A>[] = []

  for (const conn of connections) {
    const relations = [
      ...conn.relations.model,
      ...conn.relations.deployment,
    ]
    invariant(hasAtLeast(relations, 1), 'Edge must have at least one relation')

    const defaults = conn.source.$model.$styles.defaults

    const source = conn.source.id as scalar.NodeId
    const target = conn.target.id as scalar.NodeId

    if (shouldExpand && relations.length > 1) {
      const [expanded, merged] = pipe(
        relations,
        partition(r => shouldExpand(r)),
      )

      if (expanded.length > 0) {
        for (const rel of expanded) {
          const {
            title,
            color = defaults.relationship.color,
            line = defaults.relationship.line,
            head = defaults.relationship.arrow,
            ...props
          } = mergePropsFromRelationships([rel.$relationship], rel.$relationship)

          expandedEdges.push({
            id: hashEdgeId(source, target, rel.id),
            parent: conn.boundary?.id as scalar.NodeId ?? null,
            source,
            target,
            label: title ?? null,
            relations: [rel.id],
            color,
            line,
            head,
            ...props,
          } as ComputedEdge<A>)
        }

        if (merged.length > 0) {
          const mergedSource = only(filter(merged, r => r.source.id === source && r.target.id === target))
          const {
            title,
            color = defaults.relationship.color,
            line = defaults.relationship.line,
            head = defaults.relationship.arrow,
            ...props
          } = mergePropsFromRelationships(
            merged.map(r => r.$relationship),
            mergedSource?.$relationship,
          )

          nonExpandedEdges.push({
            id: conn.id,
            parent: conn.boundary?.id as scalar.NodeId ?? null,
            source,
            target,
            label: title ?? null,
            relations: merged.map((r) => r.id),
            color,
            line,
            head,
            ...props,
          } as ComputedEdge<A>)
        }
        continue
      }
    }

    const {
      title,
      color = defaults.relationship.color,
      line = defaults.relationship.line,
      head = defaults.relationship.arrow,
      ...props
    } = mergePropsFromRelationships(relations.map(r => r.$relationship))

    const edge: ComputedEdge<A> = exact({
      id: conn.id,
      parent: conn.boundary?.id as scalar.NodeId ?? null,
      source,
      target,
      label: title ?? null,
      relations: relations.map((r) => r.id),
      color,
      line,
      head,
      ...props,
    })

    nonExpandedEdges.push(edge)
  }

  return [...expandedEdges, ...mergeBidirectionalEdges(nonExpandedEdges)]
}

export function buildNodes<A extends AnyAux = Unknown>(
  model: LikeC4Model<A>,
  memory: Memory,
): ReadonlyMap<aux.NodeId, ComputedNode<A>> {
  const nodesMap = buildComputedNodes(model.$styles, [...memory.final].map(toNodeSource)) as Map<
    aux.NodeId,
    Writable<ComputedNode<A>>
  >
  // For each node, check if
  // - it is a leaf node (no children)
  // - it has a deploymentRef and modelRef
  // - it is a deployment node
  // - it has only one instance
  // If all conditions are met, inherit properties from the instance if they are not set in the deployment node
  for (const node of nodesMap.values()) {
    if (!node.deploymentRef || !node.modelRef || node.children.length > 0) {
      continue
    }
    // Find deployment element and check if it has only one instance
    const deploymentNode = model.deployment.element(node.deploymentRef)
    const onlyOneInstance = deploymentNode.isDeploymentNode() && deploymentNode.onlyOneInstance()
    if (!onlyOneInstance) {
      continue
    }

    // Inherit properties from the logical model if it is a deployment node with only one instance
    // If title was not overriden (i.e. it matches the name), take title from the instance
    if (node.title === deploymentNode.name) {
      node.title = onlyOneInstance.title
    }
    // If description/tech not set, take from instance
    node.description ??= instanceSummary(onlyOneInstance) ?? null
    node.technology ??= onlyOneInstance.technology
    // If tags/links are missing, take from instance
    if (isEmpty(node.tags)) {
      node.tags = [...onlyOneInstance.tags]
    }
    if ((!node.links || isEmpty(node.links)) && hasAtLeast(onlyOneInstance.links, 1)) {
      node.links = [...onlyOneInstance.links]
    }

    // Apply styles from instance if not set or set to defaults
    const defaults = model.$styles.defaults
    if (node.shape === defaults.shape && node.shape !== onlyOneInstance.shape) {
      node.shape = onlyOneInstance.shape
      // reset notation when shape is changed
      node.notation = null
    }
    if (node.color === defaults.color && node.color !== onlyOneInstance.color) {
      node.color = onlyOneInstance.color
      // reset notation when color is changed
      node.notation = null
    }
    if (!node.icon && onlyOneInstance.icon) {
      node.icon = onlyOneInstance.icon
    }
  }

  return nodesMap
}

export function applyDeploymentViewRuleStyles<A extends AnyAux>(
  rules: DeploymentViewRule<A>[],
  nodes: ComputedNode<A>[],
): ComputedNode<A>[] {
  for (const rule of rules) {
    if (!isViewRuleStyle(rule) || rule.targets.length === 0) {
      continue
    }
    const predicates = rule.targets.map(deploymentExpressionToPredicate)
    applyViewRuleStyle(
      rule,
      anyPass(predicates),
      nodes,
    )
  }
  return nodes
}
