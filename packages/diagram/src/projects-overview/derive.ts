import { BBox, nonNullable } from '@likec4/core'
import type { ProjectsOverviewTypes } from './_types'

type Node = ProjectsOverviewTypes.Node
type Edge = ProjectsOverviewTypes.Edge

/**
 * What the reader points at: one project and its neighbors, or one bundle of edges between two frames.
 */
export type OverviewHighlight =
  | { readonly kind: 'project'; readonly nodeId: string }
  | { readonly kind: 'bundle'; readonly key: string }
  | null

export interface OverviewFilter {
  /** Frames the reader hid. Their projects and edges are hidden too. */
  readonly hiddenGroups: ReadonlyArray<string>
  /** Keys of the edge bundles the reader hid. Only the edges of the bundle are hidden. */
  readonly hiddenBundles: ReadonlyArray<string>
  /** Frame that the reader shows alone. `null` shows all frames. */
  readonly focusFrame: string | null
  readonly highlight: OverviewHighlight
}

/**
 * All project edges between two top-level frames, drawn as one badge.
 */
export interface OverviewBundle {
  /** Stable key: the two frame ids, sorted and joined. */
  readonly key: string
  readonly frames: readonly [string, string]
  readonly frameTitles: readonly [string, string]
  readonly edgeIds: ReadonlyArray<string>
  /** The reader hid this bundle. Its edges are hidden and its badge is not drawn. */
  readonly hidden: boolean
  /** Project pairs, as `source → target` labels */
  readonly projects: ReadonlyArray<string>
  /** Absolute position of the badge, near the middle of the edges */
  readonly position: { readonly x: number; readonly y: number }
}

export const noOverviewFilter: OverviewFilter = {
  hiddenGroups: [],
  hiddenBundles: [],
  focusFrame: null,
  highlight: null,
}

export interface DerivedOverview {
  readonly nodes: Node[]
  readonly edges: Edge[]
  readonly bundles: ReadonlyArray<OverviewBundle>
}

/**
 * Applies the reader's filter and highlight to the overview nodes and edges.
 * Hidden nodes and edges stay in the list, with `hidden: true`. The layout does not change.
 */
export function deriveOverview(
  nodes: ReadonlyArray<Node>,
  edges: ReadonlyArray<Edge>,
  filter: OverviewFilter,
): DerivedOverview {
  const { byId, chainOf } = indexNodes(nodes)
  const hiddenGroups = new Set(filter.hiddenGroups)

  const isHiddenNode = (node: Node): boolean => {
    const chain = chainOf(node)
    const outsideFocus = filter.focusFrame !== null && !chain.some(item => item.id === filter.focusFrame)
    return outsideFocus || chain.some(item => hiddenGroups.has(item.id))
  }
  const hiddenIds = new Set(nodes.filter(isHiddenNode).map(node => node.id))
  const isHiddenEdge = (edge: Edge): boolean => hiddenIds.has(edge.source) || hiddenIds.has(edge.target)

  const edgesOfShownFrames = edges.filter(edge => !isHiddenEdge(edge))
  const bundles = bundlesOf(edgesOfShownFrames, new Set(filter.hiddenBundles), byId, chainOf)
  const hiddenBundleEdgeIds = new Set(bundles.filter(bundle => bundle.hidden).flatMap(bundle => bundle.edgeIds))

  const visibleEdges = edgesOfShownFrames.filter(edge => !hiddenBundleEdgeIds.has(edge.id))
  const fanIn = countBy(visibleEdges, edge => edge.target)
  const fanOut = countBy(visibleEdges, edge => edge.source)

  const kept = keptElements(filter.highlight, visibleEdges, bundles)

  const derivedNodes = nodes.map((node): Node => {
    const hidden = hiddenIds.has(node.id)
    if (node.type !== 'project') {
      return { ...node, hidden }
    }
    return {
      ...node,
      hidden,
      data: {
        ...node.data,
        dimmed: kept !== null && !kept.nodes.has(node.id),
        fanIn: fanIn.get(node.id) ?? 0,
        fanOut: fanOut.get(node.id) ?? 0,
      },
    }
  })
  const derivedEdges = edges.map((edge): Edge => ({
    ...edge,
    hidden: isHiddenEdge(edge) || hiddenBundleEdgeIds.has(edge.id),
    data: {
      ...edge.data,
      dimmed: kept !== null && !kept.edges.has(edge.id),
    },
  }))

  return { nodes: derivedNodes, edges: derivedEdges, bundles }
}

/**
 * Filter that shows only one frame. The frame and its ancestors are shown again, so the focus never gives an empty canvas.
 * Frames hidden inside the focused frame stay hidden.
 */
export function focusFrameFilter(nodes: ReadonlyArray<Node>, filter: OverviewFilter, frameId: string): OverviewFilter {
  const { byId, chainOf } = indexNodes(nodes)
  const frame = byId.get(frameId)
  const revealed = new Set((frame ? chainOf(frame) : []).map(node => node.id))
  return {
    ...filter,
    hiddenGroups: filter.hiddenGroups.filter(id => !revealed.has(id)),
    focusFrame: frameId,
    highlight: null,
  }
}

/**
 * Bounds that enclose every shown node, or null when all nodes are hidden.
 */
export function visibleBoundsOf(nodes: ReadonlyArray<Node>): BBox | null {
  const [first, ...rest] = nodes.filter(node => !node.hidden).map(node => absoluteBoundsOf(nodes, node.id))
  return first ? BBox.merge(first, ...rest) : null
}

/**
 * Absolute bounds of a node. Child positions are relative to their parent, so the chain is summed.
 */
export function absoluteBoundsOf(nodes: ReadonlyArray<Node>, nodeId: string): BBox {
  const { byId, chainOf } = indexNodes(nodes)
  const node = nonNullable(byId.get(nodeId), `Node ${nodeId} not found`)
  const origin = chainOf(node).reduce(
    (sum, item) => ({ x: sum.x + item.position.x, y: sum.y + item.position.y }),
    { x: 0, y: 0 },
  )
  return { x: origin.x, y: origin.y, width: node.data.width, height: node.data.height }
}

function indexNodes(nodes: ReadonlyArray<Node>) {
  const byId = new Map(nodes.map(node => [node.id, node] as const))
  const chainOf = (node: Node): Node[] => {
    const chain: Node[] = []
    let current: Node | undefined = node
    while (current) {
      chain.push(current)
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
    return chain
  }
  return { byId, chainOf }
}

function countBy<T>(items: ReadonlyArray<T>, key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const id = key(item)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

function keptElements(
  highlight: OverviewHighlight,
  edges: ReadonlyArray<Edge>,
  bundles: ReadonlyArray<OverviewBundle>,
): { nodes: Set<string>; edges: Set<string> } | null {
  if (highlight === null) {
    return null
  }
  const keptEdges = edges.filter(edge => {
    if (highlight.kind === 'project') {
      return edge.source === highlight.nodeId || edge.target === highlight.nodeId
    }
    return bundles.some(bundle => bundle.key === highlight.key && bundle.edgeIds.includes(edge.id))
  })
  const keptNodes = new Set<string>()
  if (highlight.kind === 'project') {
    keptNodes.add(highlight.nodeId)
  }
  for (const edge of keptEdges) {
    keptNodes.add(edge.source)
    keptNodes.add(edge.target)
  }
  return { nodes: keptNodes, edges: new Set(keptEdges.map(edge => edge.id)) }
}

function bundlesOf(
  edges: ReadonlyArray<Edge>,
  hiddenBundles: ReadonlySet<string>,
  byId: ReadonlyMap<string, Node>,
  chainOf: (node: Node) => Node[],
): OverviewBundle[] {
  type Draft = {
    frames: [Node, Node]
    edgeIds: string[]
    projects: string[]
    anchors: Array<{ x: number; y: number }>
  }
  const drafts = new Map<string, Draft>()
  for (const edge of edges) {
    const source = byId.get(edge.source)
    const target = byId.get(edge.target)
    if (!source || !target) {
      continue
    }
    const sourceFrame = chainOf(source).at(-1)
    const targetFrame = chainOf(target).at(-1)
    if (!sourceFrame || !targetFrame || sourceFrame.type !== 'project-group' || targetFrame.type !== 'project-group') {
      continue
    }
    if (sourceFrame.id === targetFrame.id) {
      continue
    }
    const pair: [Node, Node] = sourceFrame.id < targetFrame.id ? [sourceFrame, targetFrame] : [targetFrame, sourceFrame]
    const key = `${pair[0].id}|${pair[1].id}`
    const draft = drafts.get(key) ?? { frames: pair, edgeIds: [], projects: [], anchors: [] }
    draft.edgeIds.push(edge.id)
    draft.projects.push(`${titleOf(source)} → ${titleOf(target)}`)
    draft.anchors.push(midpointOf(edge))
    drafts.set(key, draft)
  }
  return [...drafts.entries()].map(([key, draft]): OverviewBundle => {
    const [first, second] = draft.frames
    return {
      key,
      frames: [first.id, second.id],
      frameTitles: [titleOf(first), titleOf(second)],
      edgeIds: draft.edgeIds,
      hidden: hiddenBundles.has(key),
      projects: draft.projects,
      position: averageOf(draft.anchors),
    }
  }).sort((a, b) => b.edgeIds.length - a.edgeIds.length || a.key.localeCompare(b.key))
}

function titleOf(node: Node): string {
  return node.data.title
}

function midpointOf(edge: Edge): { x: number; y: number } {
  const points = edge.data?.points ?? []
  if (points.length === 0) {
    return { x: 0, y: 0 }
  }
  const middle = Math.floor((points.length - 1) / 2)
  const next = Math.ceil((points.length - 1) / 2)
  const a = points[middle]!
  const b = points[next]!
  return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 }
}

function averageOf(points: ReadonlyArray<{ x: number; y: number }>): { x: number; y: number } {
  const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 })
  return { x: sum.x / points.length, y: sum.y / points.length }
}
