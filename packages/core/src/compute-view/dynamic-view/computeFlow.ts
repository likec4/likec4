import {
  filter,
  isString,
  map,
  pipe,
} from 'remeda'
import type {
  ComputedDynamicView,
  DynamicViewFlow,
  LayoutedDynamicView,
  scalar,
} from '../../types'

/**
 * Result of {@link computeFlow}: the subset of the dynamic view that should be
 * rendered for a given selection of visible subflows.
 */
export interface ComputeFlowResult<V extends ComputedDynamicView<any> | LayoutedDynamicView<any>> {
  /**
   * The subflows that were explicitly requested to be visible.
   */
  readonly subflows: readonly scalar.StepPath[]
  readonly nodes: V['nodes']
  readonly edges: V['edges']
}

/**
 * Walks the recursive flow tree of a {@link ComputedDynamicView} and resolves
 * which steps (edges) and actors (nodes) must be shown.
 *
 * By default (no `subflows`) everything is visible — every step, every loop/opt
 * and every branch of every `alt`/`try`. Passing `subflows` only narrows the
 * branches/sections of `alt`/`try` containers:
 *
 * - A container whose branches are not mentioned in `subflows` keeps showing all
 *   of them (default), independent of any selection made in other containers.
 * - Once any branch within a container is requested (the container id is a
 *   prefix of a requested subflow), that container shows only the branches on a
 *   requested path — i.e. branches that are themselves requested or that enclose
 *   a requested nested subflow.
 *
 * The last rule means selecting a deeply nested branch keeps all of its parent
 * branches visible (they enclose the requested subflow), while the parents'
 * unrelated siblings are hidden.
 *
 * @param opts.view - The computed dynamic view to resolve.
 * @param opts.subflows - Ids of subflows requested to be visible (empty = all).
 * @returns The visible nodes and edges, preserving the order of `view.nodes`
 *   and `view.edges`. Each node's `children`/`inEdges`/`outEdges` are narrowed
 *   to the visible subset to keep the result internally consistent.
 */
export function computeFlow<V extends ComputedDynamicView<any> | LayoutedDynamicView<any>>(opts: {
  view: V
  subflows?: readonly scalar.StepPath[]
}): ComputeFlowResult<V> {
  const { view, subflows = [] } = opts
  if (!view.flow) {
    throw new Error(`view '${view.id}' is outdated and has no flow. Please refresh the view.`)
  }
  const explicitlyVisible = new Set<string>(subflows)

  // Step paths (edge ids) and that must be shown.
  const visibleSteps = new Set<string>()

  // Whether any explicitly requested subflow is nested within `parentId`,
  // i.e. `parentId` is a prefix of a requested subflow path. Used both to
  // detect whether a container was selected into, and to keep a branch visible
  // because it encloses a requested nested subflow.
  const hasRequestedDescendant = (parentId: scalar.StepPath): boolean => {
    const prefix = `${parentId}.`
    for (const requested of explicitlyVisible) {
      if (requested.startsWith(prefix)) {
        return true
      }
    }
    return false
  }

  // Steps, loops, opts and pars are always visible; only the branches of an
  // `alt`/`try` are narrowed once that container has been selected into.
  const walk = (flow: ReadonlyArray<DynamicViewFlow.AnyStep>): void => {
    for (const item of flow) {
      if (isString(item)) {
        // Leaf step: shown because the enclosing flow is shown
        visibleSteps.add(item)
        continue
      }
      if (item._type === 'alt' || item._type === 'try') {
        walkBranches(item)
      } else {
        // loop / opt / par — always traversed in full
        walk(item.flow)
      }
    }
  }

  // The `flow` of an `alt`/`try` holds branch/section subflows (`alt-when`,
  // `try-block`, ...). All branches are visible by default; if the container
  // was selected into, only branches on a requested path remain.
  const walkBranches = (container: DynamicViewFlow.SubFlow.Alt | DynamicViewFlow.SubFlow.Try): void => {
    const hasSelection = hasRequestedDescendant(container.id)
    for (const branch of container.flow) {
      const visible = !hasSelection
        || explicitlyVisible.has(branch.id)
        || hasRequestedDescendant(branch.id)
      if (!visible) {
        continue
      }
      walk(branch.flow)
    }
  }
  walk(view.flow)

  // If all edges are visible
  if (visibleSteps.size === view.edges.length) {
    return {
      edges: view.edges,
      nodes: view.nodes,
      subflows,
    }
  }

  // Edges that correspond to visible steps (preserve view order)
  const edges = filter(view.edges, e => visibleSteps.has(e.id))
  const visibleActors = new Set<scalar.NodeId>()
  const visibleEdgeIds = new Set<scalar.EdgeId>(map(edges, e => {
    visibleActors.add(e.source)
    visibleActors.add(e.target)
    return e.id
  }))

  // Include visible actors and their ancestors (compound nodes), so the
  // resulting node tree stays connected up to the roots.
  const nodesById = new Map(view.nodes.map(n => [n.id, n]))
  const visibleNodes = new Set<scalar.NodeId>()
  for (const actor of visibleActors) {
    let current = actor as scalar.NodeId | null
    while (current && !visibleNodes.has(current)) {
      visibleNodes.add(current)
      current = nodesById.get(current)?.parent ?? null
    }
  }

  const nodes = pipe(
    view.nodes,
    filter(n => visibleNodes.has(n.id)),
    map((n): V['nodes'][number] => ({
      ...n,
      children: n.children.filter(c => visibleNodes.has(c)),
      inEdges: n.inEdges.filter(e => visibleEdgeIds.has(e)),
      outEdges: n.outEdges.filter(e => visibleEdgeIds.has(e)),
    })),
  )

  return {
    subflows,
    nodes,
    edges,
  }
}
