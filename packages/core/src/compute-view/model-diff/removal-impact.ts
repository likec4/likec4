import { hasAtLeast, isTruthy } from 'remeda'
import type {
  DeployedInstanceModel,
  DeploymentNodeModel,
  ElementModel,
  LikeC4Model,
  RelationshipModel,
} from '../../model'
import type { AnyAux, aux, ComputedEdge, ComputedNode, DiffStatus, scalar } from '../../types'
import { ancestorsFqn, isAncestor } from '../../utils/fqn'
import type { AdhocViewPredicate } from '../adhoc-view/compute'
import { withStatus } from './compare-view'

/**
 * What removing elements from the model takes with it.
 */
export interface RemovalImpact<A extends AnyAux = AnyAux> {
  /**
   * Elements requested for removal
   */
  readonly targets: ReadonlyArray<aux.StrictFqn<A>>
  /**
   * Targets and their descendants
   */
  readonly elements: ReadonlyArray<aux.StrictFqn<A>>
  /**
   * Relationships with a removed element as source or target
   */
  readonly relations: ReadonlyArray<scalar.RelationId>
  /**
   * Deployed instances of removed elements
   */
  readonly deployedInstances: ReadonlyArray<aux.StrictDeploymentFqn<A>>
  /**
   * Deployment nodes left without deployed instances
   */
  readonly emptyDeploymentNodes: ReadonlyArray<aux.StrictDeploymentFqn<A>>
  /**
   * Views that show a removed element or relationship
   */
  readonly affectedViews: ReadonlyArray<aux.StrictViewId<A>>
  /**
   * Views scoped to a removed element (`view of`)
   */
  readonly scopedViews: ReadonlyArray<aux.StrictViewId<A>>
  /**
   * Elements left without relationships after the removal.
   * Suggested for removal, never removed automatically.
   */
  readonly orphans: ReadonlyArray<aux.StrictFqn<A>>
}

/**
 * Computes what removing the target elements takes with it.
 *
 * Requires: a computed model for view impact (a parsed model reports no views).
 * Guarantees: targets that do not exist in the model are ignored.
 * An orphan is an element (not an ancestor of a target) whose relationships are all removed.
 */
export function computeRemovalImpact<A extends AnyAux>(
  model: LikeC4Model<A>,
  targets: Iterable<aux.LooseElementId<A>>,
): RemovalImpact<A> {
  const targetElements = [...targets].map(fqn => model.findElement(fqn)).filter(isTruthy)

  const removed = new Map<string, ElementModel<A>>()
  for (const target of targetElements) {
    removed.set(target.id, target)
    for (const descendant of target.descendants()) {
      removed.set(descendant.id, descendant)
    }
  }

  const relations = new Map<string, RelationshipModel<A>>()
  for (const element of removed.values()) {
    for (const relation of [...element.incoming('direct'), ...element.outgoing('direct')]) {
      relations.set(relation.id, relation)
    }
  }

  const instances = new Map<string, DeployedInstanceModel<A>>()
  for (const element of removed.values()) {
    for (const instance of element.deployments()) {
      instances.set(instance.id, instance)
    }
  }
  const emptyDeploymentNodes = new Set<aux.StrictDeploymentFqn<A>>()
  for (const instance of instances.values()) {
    let node: DeploymentNodeModel<A> | null = instance.parent
    while (node && !emptyDeploymentNodes.has(node.id)) {
      const nodeInstances = [...node.instances()]
      if (!nodeInstances.every(i => instances.has(i.id))) {
        break
      }
      emptyDeploymentNodes.add(node.id)
      node = node.parent
    }
  }

  const affectedViews = new Set<aux.StrictViewId<A>>()
  const scopedViews = new Set<aux.StrictViewId<A>>()
  for (const element of removed.values()) {
    for (const view of element.views()) {
      affectedViews.add(view.id)
    }
    for (const view of element.scopedViews()) {
      scopedViews.add(view.id)
    }
  }
  for (const relation of relations.values()) {
    for (const view of relation.views()) {
      affectedViews.add(view.id)
    }
  }

  const ancestorsOfTargets = new Set<string>(targetElements.flatMap(t => ancestorsFqn(t.id)))
  const candidates = new Map<string, ElementModel<A>>()
  for (const relation of relations.values()) {
    for (const endpoint of [relation.source, relation.target]) {
      if (!removed.has(endpoint.id) && !ancestorsOfTargets.has(endpoint.id)) {
        candidates.set(endpoint.id, endpoint)
      }
    }
  }
  const orphanElements = [...candidates.values()].filter(candidate => {
    const own = [...candidate.incoming(), ...candidate.outgoing()]
    return own.length > 0 && own.every(relation => relations.has(relation.id))
  })
  // Keep top-most orphans: removing an orphan removes its descendants too
  const orphans = orphanElements
    .filter(orphan => !orphanElements.some(other => isAncestor(other.id, orphan.id)))
    .map(orphan => orphan.id)

  return {
    targets: targetElements.map(t => t.id),
    elements: [...removed.values()].map(e => e.id),
    relations: [...relations.values()].map(r => r.id),
    deployedInstances: [...instances.values()].map(i => i.id),
    emptyDeploymentNodes: [...emptyDeploymentNodes],
    affectedViews: [...affectedViews],
    scopedViews: [...scopedViews],
    orphans,
  }
}

/**
 * Predicates of an ad-hoc view that shows the removal impact:
 * the targets with their children, their counterparts and the orphans.
 */
export function removalImpactViewPredicates<A extends AnyAux>(
  model: LikeC4Model<A>,
  impact: RemovalImpact<A>,
): AdhocViewPredicate<A>[] {
  const predicates: AdhocViewPredicate<A>[] = []
  if (!hasAtLeast(impact.targets, 1)) {
    return predicates
  }
  // In/out predicates go first: an element predicate before them in the same rule hides the counterparts
  predicates.push(
    { include: impact.targets.map(target => ({ inout: { ref: { model: target } } })) },
    {
      include: [...impact.targets, ...impact.orphans].map(fqn => ({ ref: { model: fqn } })),
    },
  )
  const withChildren = impact.targets.filter(target => (model.findElement(target)?.children().size ?? 0) > 0)
  if (hasAtLeast(withChildren, 1)) {
    predicates.push({
      include: withChildren.map(target => ({ ref: { model: target }, selector: 'children' as const })),
    })
  }
  return predicates
}

/**
 * Marks nodes and edges of a view with their removal status:
 * removed elements and relationships as `removed`, orphans as `orphan`.
 * An edge with only some removed relationships is `modified`.
 */
export function markRemovalImpact<
  A extends AnyAux,
  V extends { readonly nodes: ReadonlyArray<ComputedNode<A>>; readonly edges: ReadonlyArray<ComputedEdge<A>> },
>(view: V, impact: RemovalImpact<A>): V {
  const removedElements = new Set<string>(impact.elements)
  const removedRelations = new Set<string>(impact.relations)
  const orphans = new Set<string>(impact.orphans)

  const nodeStatus = ({ modelRef }: ComputedNode<A>): DiffStatus | undefined => {
    if (modelRef && removedElements.has(modelRef)) {
      return 'removed'
    }
    return modelRef && orphans.has(modelRef) ? 'orphan' : undefined
  }
  const edgeStatus = (edge: ComputedEdge<A>): DiffStatus | undefined => {
    const removedCount = edge.relations.filter(r => removedRelations.has(r)).length
    switch (true) {
      case removedCount === 0:
        return undefined
      case removedCount === edge.relations.length:
        return 'removed'
      default:
        return 'modified'
    }
  }
  return {
    ...view,
    nodes: view.nodes.map(node => withStatus(node, nodeStatus(node))),
    edges: view.edges.map(edge => withStatus(edge, edgeStatus(edge))),
  }
}
