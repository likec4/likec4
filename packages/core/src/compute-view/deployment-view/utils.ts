import { hasAtLeast, unique } from 'remeda'
import type {
  DeployedInstanceModel,
  DeploymentConnectionModel,
  DeploymentElementModel,
  DeploymentNodeModel,
  ElementModel,
  LikeC4DeploymentModel,
} from '../../model'
import { deploymentConnection } from '../../model'
import {
  type AnyAux,
  type aux,
  type ComputedEdge,
  type ComputedNode,
  type DeploymentViewRule,
  type scalar,
  type Unknown,
  FqnExpr,
  isViewRuleStyle,
  omitUndefined,
  preferSummary,
} from '../../types'
import { invariant, nameFromFqn, nonexhaustive, parentFqn } from '../../utils'
import { applyViewRuleStyle } from '../utils/applyViewRuleStyles'
import { type ComputedNodeSource, buildComputedNodes } from '../utils/buildComputedNodes'
import { mergePropsFromRelationships } from '../utils/merge-props-from-relationships'
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

export function toNodeSource<A extends AnyAux>(
  el: DeploymentNodeModel<A> | DeployedInstanceModel<A>,
): ComputedNodeSource<A> {
  if (el.isDeploymentNode()) {
    const onlyOneInstance = el.onlyOneInstance()
    let {
      title,
      id,
      description,
      summary,
      metadata,
      style,
      element,
      tags: _tags, // omit
      ...$node
    } = el.$node
    let icon = el.style.icon
    let tags = [...el.tags]
    // let description
    // If there is only one instance
    summary ??= description
    if (onlyOneInstance) {
      tags = unique([...tags, ...onlyOneInstance.tags])
      // If title was not overriden, take title from the instance
      if (title === nameFromFqn(el.id)) {
        title = onlyOneInstance.title
      }
      icon ??= onlyOneInstance.style.icon
      summary ??= instanceSummary(onlyOneInstance)
    }

    return omitUndefined({
      id: id as scalar.NodeId,
      deploymentRef: id,
      title,
      ...$node,
      color: style.color ?? onlyOneInstance?.color ?? el.color,
      shape: el.shape,
      ...(onlyOneInstance && {
        modelRef: onlyOneInstance.element.id,
      }),
      icon,
      description: summary,
      tags,
      style,
    })
  }
  invariant(el.isInstance(), 'Expected Instance')
  const instance = el.$instance
  const element = el.element
  const { icon, color, shape, ...style } = el.style

  const links = [
    ...element.links,
    ...(instance.links ?? []),
  ]

  const notation = instance.notation ?? element.$element.notation

  const description = instanceSummary(el)

  const technology = el.technology ?? undefined

  return omitUndefined({
    id: el.id as scalar.NodeId,
    kind: 'instance' as unknown as aux.DeploymentKind<A>,
    title: el.title,
    description,
    technology,
    tags: [...el.tags],
    links: hasAtLeast(links, 1) ? links : undefined,
    icon,
    color,
    shape,
    style,
    deploymentRef: instance.id,
    modelRef: element.id,
    notation,
  })
}

export function toComputedEdges<A extends AnyAux>(
  connections: ReadonlyArray<DeploymentConnectionModel<A>>,
): ComputedEdge<A>[] {
  return connections.reduce((acc, e) => {
    // const modelRelations = []
    // const deploymentRelations = []
    const relations = [
      ...e.relations.model,
      ...e.relations.deployment,
    ]
    invariant(hasAtLeast(relations, 1), 'Edge must have at least one relation')

    const source = e.source.id as scalar.NodeId
    const target = e.target.id as scalar.NodeId

    const {
      title,
      ...props
    } = mergePropsFromRelationships(relations.map(r => r.$relationship)) // || relations.find(r => r.source === source && r.target === target)

    const edge: ComputedEdge<A> = {
      id: e.id,
      parent: e.boundary?.id as scalar.NodeId ?? null,
      source,
      target,
      label: title ?? null,
      relations: relations.map((r) => r.id),
      ...props,
    }

    // If exists same edge but in opposite direction
    const existing = acc.find(e => e.source === target && e.target === source)
    if (existing && edge.label === existing.label) {
      existing.dir = 'both'
      const head = existing.head ?? edge.head ?? e.source.$model.$styles.defaults.relationship.arrow
      existing.head ??= head
      existing.tail ??= head

      if (edge.color) {
        existing.color ??= edge.color
      }
      if (edge.line) {
        existing.line ??= edge.line
      }
      return acc
    }

    acc.push(edge)
    return acc
  }, [] as ComputedEdge<A>[])
}

export function buildNodes<A extends AnyAux = Unknown>(
  memory: Memory,
): ReadonlyMap<aux.NodeId, ComputedNode<A>> {
  return buildComputedNodes([...memory.final].map(toNodeSource))
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
    applyViewRuleStyle(rule, predicates, nodes)
  }
  return nodes
}
