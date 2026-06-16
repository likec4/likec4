import {
  filter,
  isString,
  map,
  pipe,
} from 'remeda'
import {
  type Any,
  type ComputedDynamicView,
  type ComputedEdge,
  type ComputedNode,
  type scalar,
} from '../../types'

/**
 * Result of {@link computeFlow}: the subset of the dynamic view that should be
 * rendered for a given selection of visible subflows.
 */
export interface ComputeFlowResult<A extends Any = Any> {
  readonly nodes: ComputedNode<A>[]
  readonly edges: ComputedEdge<A>[]
}

/**
 * Walks the recursive flow tree of a {@link ComputedDynamicView} and resolves
 * which steps (edges) and actors (nodes) must be shown.
 *
 * A step (leaf {@link scalar.StepPath}) is shown when the flow that contains it
 * is shown. A subflow (`opt`, `alt`, `try`, ...) is shown when it is either
 * visible by default (`visible === true`) or explicitly requested via
 * `subflows`. Visibility is hierarchical: a nested subflow is only evaluated
 * when its whole ancestor chain is shown, so requesting a deeply nested subflow
 * requires its ancestors to be visible (by default or explicitly) as well.
 *
 * Special case for `alt` and `try`: once any of its branches/sections is
 * explicitly requested (the `alt`/`try` id is a prefix of some requested
 * subflow), the `visible` flag on its branches/sections is ignored and only the
 * explicitly requested ones are shown (so the default-visible branch or
 * `try-block` is hidden unless it too was requested).
 *
 * @param opts.view - The computed dynamic view to resolve.
 * @param opts.subflows - Ids of subflows that are explicitly made visible.
 * @returns The visible nodes and edges, preserving the order of `view.nodes`
 *   and `view.edges`. Each node's `children`/`inEdges`/`outEdges` are narrowed
 *   to the visible subset to keep the result internally consistent.
 */
export function computeFlow<A extends Any>(opts: {
  view: ComputedDynamicView<A>
  subflows: readonly scalar.StepPath[]
}): ComputeFlowResult<A> {
  const { view, subflows } = opts
  const explicitlyVisible = new Set<string>(subflows)

  // Step paths (edge ids) and actors (node ids) that must be shown.
  const visibleSteps = new Set<string>()
  const visibleActors = new Set<scalar.NodeId>(view.flow.actors)

  const isSubFlowVisible = (subflow: ComputedDynamicView.AnySubFlow): boolean =>
    subflow.visible === true || explicitlyVisible.has(subflow.id)

  // Whether any explicitly requested subflow is nested within `parentId`,
  // i.e. `parentId` is a prefix of a requested subflow path.
  const hasRequestedDescendant = (parentId: scalar.StepPath): boolean => {
    const prefix = `${parentId}.`
    for (const requested of explicitlyVisible) {
      if (requested.startsWith(prefix)) {
        return true
      }
    }
    return false
  }

  // The `flow` of `try`/`alt` holds section/branch subflows (`try-block`,
  // `alt-when`, ...) which are not part of `ComputedSubFlow`, so the walk
  // accepts any subflow shape.
  //
  // `explicitOnly` switches a subflow's children to "requested only" mode,
  // ignoring their `visible` flag. It is enabled for the branches/sections of
  // an `alt`/`try` as soon as one of them is explicitly selected.
  const walk = (
    flow: ReadonlyArray<scalar.StepPath | ComputedDynamicView.AnySubFlow>,
    explicitOnly = false,
  ): void => {
    for (const item of flow) {
      if (isString(item)) {
        // Leaf step: shown because the enclosing flow is shown
        visibleSteps.add(item)
        continue
      }
      const visible = explicitOnly ? explicitlyVisible.has(item.id) : isSubFlowVisible(item)
      if (!visible) {
        continue
      }
      for (const actor of item.actors) {
        visibleActors.add(actor)
      }
      // `alt` branches and `try` sections are mutually-exclusive selectors:
      // selecting any one of them overrides the default-visible one.
      const selectsBranches = item._type === 'alt' || item._type === 'try'
      walk(item.flow, selectsBranches && hasRequestedDescendant(item.id))
    }
  }
  walk(view.flow.flow)

  // Edges that correspond to visible steps (preserve view order)
  const edges = filter(view.edges, e => visibleSteps.has(e.id)) as ComputedEdge<A>[]
  const visibleEdgeIds = new Set<scalar.EdgeId>(map(edges, e => e.id))

  // Include visible actors and their ancestors (compound nodes), so the
  // resulting node tree stays connected up to the roots.
  const nodesById = new Map(view.nodes.map(n => [n.id, n]))
  const visibleNodes = new Set<scalar.NodeId>()
  for (const actor of visibleActors) {
    let current: scalar.NodeId | null = actor
    while (current && !visibleNodes.has(current)) {
      visibleNodes.add(current)
      current = nodesById.get(current)?.parent ?? null
    }
  }

  const nodes = pipe(
    view.nodes,
    filter(n => visibleNodes.has(n.id)),
    map((n): ComputedNode<A> => ({
      ...n,
      children: n.children.filter(c => visibleNodes.has(c)),
      inEdges: n.inEdges.filter(e => visibleEdgeIds.has(e)),
      outEdges: n.outEdges.filter(e => visibleEdgeIds.has(e)),
    })),
  )

  return { nodes, edges }
}
