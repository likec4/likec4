import { hasAtLeast, isEmpty, isNumber, isString } from 'remeda'
import { invariant, nonexhaustive } from '../../errors'
import type { DeployedInstanceModel, DeploymentNodeModel, LikeC4DeploymentModel } from '../../model'
import type { DeploymentConnectionModel } from '../../model/connection/deployment'
import type { ElementModel } from '../../model/ElementModel'
import type { AnyAux, Aux, Unknown } from '../../types'
import {
  type ComputedEdge,
  type ComputedNode,
  type DeploymentViewRule,
  DefaultArrowType,
  FqnExpr,
  isViewRuleStyle,
} from '../../types'
import { nameFromFqn, parentFqn } from '../../utils'
import { applyViewRuleStyle } from '../utils/applyViewRuleStyles'
import { type ComputedNodeSource, buildComputedNodes } from '../utils/buildComputedNodes'
import { mergePropsFromRelationships } from '../utils/merge-props-from-relationships'
import { uniqueTags } from '../utils/uniqueTags'
import type { Elem, Memory } from './_types'

type Predicate<T> = (x: T) => boolean

export function resolveElements(
  model: LikeC4DeploymentModel,
  expr: FqnExpr.DeploymentRef,
): Elem[] {
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

export function resolveModelElements(
  model: LikeC4DeploymentModel,
  expr: FqnExpr.ModelRef,
): ElementModel[] {
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

export function deploymentExpressionToPredicate<T extends { id: string; modelRef?: number | string }>(
  target: FqnExpr,
): Predicate<T> {
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
    const modelFqn = (node: T) => {
      if (isString(node.modelRef)) {
        return node.modelRef
      }
      if (isNumber(node.modelRef)) {
        return node.id
      }
      return null
    }

    const fqn = target.ref.model
    if (target.selector === 'expanded') {
      const fqnWithDot = fqn + '.'
      return (n) => {
        const m = modelFqn(n)
        if (!m) {
          return true
        }
        return m === fqn || m.startsWith(fqnWithDot)
      }
    }
    if (target.selector === 'descendants') {
      const fqnWithDot = fqn + '.'
      return (n) => {
        const m = modelFqn(n)
        if (!m) {
          return true
        }
        return m.startsWith(fqnWithDot)
      }
    }
    if (target.selector === 'children') {
      return (n) => {
        const m = modelFqn(n)
        if (!m) {
          return true
        }
        return parentFqn(m) === fqn
      }
    }
    return (n) => {
      const m = modelFqn(n)
      if (!m) {
        return true
      }
      return m === fqn
    }
  }
  nonexhaustive(target)
}

export function toNodeSource<A extends AnyAux>(
  el: DeploymentNodeModel<A> | DeployedInstanceModel<A>,
): ComputedNodeSource<A> {
  if (el.isDeploymentNode()) {
    const onlyOneInstance = el.onlyOneInstance()
    let { title, kind, id, ...$node } = el.$node
    const { icon, color, shape, ...style } = el.$node.style ?? {}

    // If there is only one instance and title was not overriden
    if (onlyOneInstance && title === nameFromFqn(el.id)) {
      title = onlyOneInstance.title
    }

    return {
      ...(onlyOneInstance && {
        ...toNodeSource(onlyOneInstance),
        modelRef: onlyOneInstance.element.id,
      }),
      title,
      ...$node,
      ...(icon && { icon }),
      ...(color && { color }),
      ...(shape && { shape }),
      style: {
        ...style,
      },
      deploymentRef: 1,
      kind,
      id: id as unknown as Aux.Strict.NodeId<A>,
    }
  }
  invariant(el.isInstance(), 'Expected Instance')
  const instance = el.$instance
  const element = el.element

  const icon = instance.style?.icon ?? element.icon
  const color = instance.style?.color ?? element.color
  const shape = instance.style?.shape ?? element.shape

  const links = [
    ...element.links,
    ...(instance.links ?? []),
  ]

  const metadata = {
    ...element.getMetadata(),
    ...instance.metadata,
  }

  const notation = instance.notation ?? element.$element.notation

  return {
    id: el.id as unknown as Aux.Strict.NodeId<A>,
    kind: 'instance' as Aux.DeploymentKind<A>,
    title: instance.title ?? element.title,
    description: instance.description ?? element.description,
    technology: instance.technology ?? element.technology,
    tags: uniqueTags([element, el]) ?? [],
    links: hasAtLeast(links, 1) ? links : null,
    ...icon && { icon },
    ...color && { color },
    ...shape && { shape },
    style: {
      ...element.style,
      ...instance.style,
    },
    deploymentRef: el.id === instance.id ? 1 : instance.id,
    modelRef: element.id,
    ...notation && { notation },
    ...!isEmpty(metadata) && ({ metadata }),
  }
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

    const source = e.source.id as unknown as Aux.Strict.NodeId<A>
    const target = e.target.id as unknown as Aux.Strict.NodeId<A>

    const {
      title,
      ...props
    } = mergePropsFromRelationships(relations.map(r => r.$relationship)) // || relations.find(r => r.source === source && r.target === target)

    const edge: ComputedEdge<A> = {
      id: e.id,
      parent: e.boundary?.id as unknown as Aux.Strict.NodeId<A> ?? null,
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
      const head = existing.head ?? edge.head ?? DefaultArrowType
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
): ReadonlyMap<Aux.Strict.NodeId<A>, ComputedNode<A>> {
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
