import { entries, isDeepEqual, isNonNull, pick, values } from 'remeda'
import { LikeC4Model } from '../../model'
import type {
  AnyAux,
  ComputedEdge,
  ComputedNode,
  ComputedView,
  DiffId,
  DiffStatus,
  DiffStatusCounts,
  LayoutedView,
  ModelDiff,
  ParsedLikeC4ModelData,
  ParsedView,
} from '../../types'
import { EdgeId } from '../../types'
import { ifind } from '../../utils/iterable'
import { equals as equalsSet } from '../../utils/set'
import { stringHash } from '../../utils/string-hash'
import { computeView } from '../compute-view'
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges'
import { applyModelDiff, diffOnlyElements } from './apply-model-diff'
import { sanitizeParsedView } from './sanitize'

/**
 * What a compare view shows:
 * - `as-is`: the model before the diff
 * - `changes`: both states, nodes and edges marked with their diff status
 * - `to-be`: the model after the diff
 */
export type CompareViewMode = 'as-is' | 'changes' | 'to-be'

/**
 * Compare view with the number of changed nodes and edges
 */
export interface CompareViewResult<A extends AnyAux = AnyAux> {
  view: ComputedView<A>
  nodes: DiffStatusCounts
  edges: DiffStatusCounts
  /**
   * True if the diff changes anything in the view
   */
  isAffected: boolean
}

/**
 * Models before and after the diff.
 */
export interface CompareModels<A extends AnyAux = AnyAux> {
  diff: ModelDiff<A>
  before: LikeC4Model<A>
  after: LikeC4Model<A>
}

/**
 * Creates the models before and after the diff.
 * The model "before" does not contain elements that exist only in diffs.
 *
 * Returns `null` if the model data has no diff with the given id.
 */
export function createCompareModels<A extends AnyAux>(
  data: ParsedLikeC4ModelData<A>,
  diffId: DiffId,
): CompareModels<A> | null {
  const diff = data.diffs?.[diffId]
  if (!diff) {
    return null
  }
  return {
    diff,
    before: LikeC4Model.create(data),
    after: LikeC4Model.create(applyModelDiff(data, diff)),
  }
}

/**
 * Computes the view against the model state.
 * References to elements missing in this state are dropped.
 *
 * Returns `null` if the view does not exist in this state or fails to compute.
 */
function computeViewInState<A extends AnyAux>(
  source: ParsedView<A>,
  model: LikeC4Model<A>,
): ComputedView<A> | null {
  const elements = model.$data.elements
  const sanitized = sanitizeParsedView(source, fqn => !(fqn in elements))
  if (!sanitized) {
    return null
  }
  const result = computeView(sanitized, model)
  return result.isSuccess ? result.view : null
}

/**
 * Returns a view without references to elements that exist only in diffs.
 * Views of projects without diffs are returned unchanged.
 */
export function withoutDiffOnlyReferences<A extends AnyAux>(
  source: ParsedView<A>,
  data: ParsedLikeC4ModelData<A>,
): ParsedView<A> | null {
  const diffOnly = diffOnlyElements(data)
  if (diffOnly.size === 0) {
    return source
  }
  return sanitizeParsedView(source, fqn => diffOnly.has(fqn))
}

function isNodeChanged(before: ComputedNode, after: ComputedNode): boolean {
  return before.title !== after.title
    || before.kind !== after.kind
    || (before.technology ?? null) !== (after.technology ?? null)
    || !isDeepEqual(before.description ?? null, after.description ?? null)
    || !isDeepEqual([...before.tags].sort(), [...after.tags].sort())
}

export function withStatus<T extends ComputedNode | ComputedEdge>(item: T, diffStatus: DiffStatus | undefined): T {
  return diffStatus ? { ...item, diffStatus } : item
}

function withoutDiff<T extends ComputedNode | ComputedEdge>(item: T): T {
  if (!item.diffStatus && !item.diffBefore) {
    return item
  }
  const copy = { ...item }
  delete copy.diffStatus
  delete copy.diffBefore
  return copy
}

/**
 * Restores properties of a modified node or edge as they were before the diff
 */
function asBefore<T extends ComputedNode | ComputedEdge>(item: T): T {
  return item.diffBefore ? withoutDiff({ ...item, ...item.diffBefore }) : withoutDiff(item)
}

function linkNodesAndEdges<N extends ComputedNode, E extends ComputedEdge>(
  nodes: ReadonlyArray<N>,
  edges: ReadonlyArray<E>,
): { nodes: N[]; edges: E[] } {
  const byId = new Map<string, N>()
  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [], inEdges: [], outEdges: [] })
  }

  // Parents go before their children
  const ordered: N[] = []
  const visited = new Set<string>()
  const visit = (node: N) => {
    if (visited.has(node.id)) {
      return
    }
    visited.add(node.id)
    const parent = node.parent ? byId.get(node.parent) : undefined
    if (parent) {
      visit(parent)
    }
    ordered.push(node)
  }
  byId.forEach(visit)

  for (const node of ordered) {
    const parent = node.parent ? byId.get(node.parent) : undefined
    if (parent) {
      parent.children.push(node.id)
      node.level = parent.level + 1
    } else {
      node.parent = null
      node.level = 0
    }
  }
  for (const node of [...ordered].reverse()) {
    if (node.children.length > 0) {
      node.depth = Math.max(...node.children.map(id => byId.get(id)?.depth ?? 0)) + 1
    } else {
      delete node.depth
    }
  }

  const linkedEdges = edges.map(edge => ({ ...edge }))
  linkNodesWithEdges(byId, linkedEdges)
  return { nodes: ordered, edges: linkedEdges }
}

function countStatuses(items: ReadonlyArray<ComputedNode | ComputedEdge>): DiffStatusCounts {
  const counts: DiffStatusCounts = { added: 0, removed: 0, modified: 0 }
  for (const { diffStatus } of items) {
    if (diffStatus === 'added' || diffStatus === 'removed' || diffStatus === 'modified') {
      counts[diffStatus]++
    }
  }
  return counts
}

/**
 * Merges the view computed before and after the diff into one view.
 * Nodes and edges are marked with their diff status.
 *
 * - Nodes are matched by id.
 * - Edges are matched by id, then by source path (dynamic views), then by source and target.
 * - An edge is `modified` if its relationships changed.
 * - A node is `modified` if its label or tags changed, or if it is listed in `modified`.
 *
 * Returns `null` if the view exists in neither state.
 */
function mergeComputedViews<A extends AnyAux>(
  before: ComputedView<A> | null,
  after: ComputedView<A> | null,
  modified: ReadonlySet<string>,
): CompareViewResult<A> | null {
  const base = after ?? before
  if (!base) {
    return null
  }
  const beforeNodes = new Map((before?.nodes ?? []).map(node => [node.id, node]))
  const afterNodeIds = new Set((after?.nodes ?? []).map(node => node.id))

  const nodes: ComputedNode<A>[] = []
  for (const node of after?.nodes ?? []) {
    const previous = beforeNodes.get(node.id)
    if (!previous) {
      nodes.push(withStatus(node, 'added'))
      continue
    }
    const isModified = (!!node.modelRef && modified.has(node.modelRef)) || isNodeChanged(previous, node)
    nodes.push(
      isModified
        ? {
          ...node,
          diffStatus: 'modified',
          diffBefore: pick(previous, ['title', 'description', 'technology', 'tags', 'color', 'shape', 'icon']),
        }
        : node,
    )
  }
  for (const node of before?.nodes ?? []) {
    if (!afterNodeIds.has(node.id)) {
      nodes.push(withStatus(node, 'removed'))
    }
  }

  const unmatched = new Map((before?.edges ?? []).map(edge => [edge.id, edge]))
  const findMatch = (edge: ComputedEdge<A>): ComputedEdge<A> | undefined =>
    unmatched.get(edge.id)
      ?? (edge.astPath ? ifind(unmatched.values(), c => c.astPath === edge.astPath) : undefined)
      ?? ifind(unmatched.values(), c => c.source === edge.source && c.target === edge.target)

  const edges: ComputedEdge<A>[] = []
  const edgeIds = new Set<string>()
  for (const edge of after?.edges ?? []) {
    const previous = findMatch(edge)
    edgeIds.add(edge.id)
    if (!previous) {
      edges.push(withStatus(edge, 'added'))
      continue
    }
    unmatched.delete(previous.id)
    edges.push(
      equalsSet(new Set(previous.relations), new Set(edge.relations)) ? edge : {
        ...edge,
        diffStatus: 'modified',
        diffBefore: pick(previous, ['label', 'description', 'technology', 'relations', 'color', 'line']),
      },
    )
  }
  for (const edge of unmatched.values()) {
    const id = edgeIds.has(edge.id) ? EdgeId(`${edge.id}~removed`) : edge.id
    edges.push({ ...withStatus(edge, 'removed'), id })
  }

  const linked = linkNodesAndEdges(nodes, edges)
  const nodeCounts = countStatuses(linked.nodes)
  const edgeCounts = countStatuses(linked.edges)
  const total = nodeCounts.added + nodeCounts.removed + nodeCounts.modified
    + edgeCounts.added + edgeCounts.removed + edgeCounts.modified

  return {
    view: {
      ...base,
      hash: stringHash(`compare:${before?.hash ?? ''}:${after?.hash ?? ''}`),
      nodes: linked.nodes,
      edges: linked.edges,
    },
    nodes: nodeCounts,
    edges: edgeCounts,
    isAffected: total > 0,
  }
}

/**
 * Computes the compare view: the view before and after the diff, merged into one view.
 *
 * Returns `null` if the view exists in neither state.
 */
export function computeCompareView<A extends AnyAux>(
  source: ParsedView<A>,
  models: CompareModels<A>,
): CompareViewResult<A> | null {
  return mergeComputedViews(
    computeViewInState(source, models.before),
    computeViewInState(source, models.after),
    new Set(Object.keys(models.diff.modify.elements)),
  )
}

/**
 * Computes compare views for all views of the model.
 */
export function computeCompareViews<A extends AnyAux>(
  data: ParsedLikeC4ModelData<A>,
  models: CompareModels<A>,
): CompareViewResult<A>[] {
  const modified = new Set(Object.keys(models.diff.modify.elements))
  const existing = entries(data.views).map(([, source]) => computeCompareView(source, models))
  const introduced = values(models.diff.views ?? {})
    .filter(view => !(view.id in data.views))
    .map(source => mergeComputedViews(null, computeViewInState(source, models.after), modified))
  return [...existing, ...introduced].filter(isNonNull)
}

function filterItems<N extends ComputedNode, E extends ComputedEdge>(
  nodes: ReadonlyArray<N>,
  edges: ReadonlyArray<E>,
  mode: 'as-is' | 'to-be',
): { nodes: N[]; edges: E[] } {
  const hiddenStatus: DiffStatus = mode === 'as-is' ? 'added' : 'removed'
  const toState = mode === 'as-is' ? asBefore : withoutDiff
  const hidden = new Set<string>()
  // Nodes are ordered parents first
  for (const node of nodes) {
    if (node.diffStatus === hiddenStatus || (node.parent && hidden.has(node.parent))) {
      hidden.add(node.id)
    }
  }
  const visibleNodes = nodes.filter(node => !hidden.has(node.id))
  const visibleEdges = edges.filter(edge =>
    edge.diffStatus !== hiddenStatus && !hidden.has(edge.source) && !hidden.has(edge.target)
  )
  const nodeIds = new Set(visibleNodes.map(n => n.id))
  const edgeIds = new Set<string>(visibleEdges.map(e => e.id))
  return {
    nodes: visibleNodes.map(node => ({
      ...toState(node),
      children: node.children.filter(id => nodeIds.has(id)),
      inEdges: node.inEdges.filter(id => edgeIds.has(id)),
      outEdges: node.outEdges.filter(id => edgeIds.has(id)),
    })),
    edges: visibleEdges.map(edge => toState(edge)),
  }
}

/**
 * Returns the compare view as it looks in the given mode.
 * Nodes keep their positions, so switching between modes does not move them.
 *
 * - `as-is`: hides added nodes and edges, clears diff statuses
 * - `to-be`: hides removed nodes and edges, clears diff statuses
 * - `changes`: returns the view unchanged
 */
export function filterCompareView<V extends ComputedView | LayoutedView>(view: V, mode: CompareViewMode): V {
  return mode === 'changes' ? view : { ...view, ...filterItems(view.nodes, view.edges, mode) }
}
