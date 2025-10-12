import { produce } from 'immer'
import { hasSubObject, isShallowEqual, pick } from 'remeda'
import { buildElementNotations } from '../../compute-view/utils/buildElementNotations'
import {
  type LayoutedView,
  type LayoutedViewDriftReason,
  type ViewManualLayoutSnapshot,
  _layout,
  _type,
  BBox,
} from '../../types'
import { difference, invariant, symmetricDifference } from '../../utils'

/**
 * Maximum allowed drift per coordinate (top, left, bottom, right)
 */
const MAX_ALLOWED_DRIFT = 5

/**
 * Use layout from the snapshot, and 'safe'-apply style properties from the `autoLayouted` view
 *
 * @param autoLayouted Auto-layouted view
 * @param snapshot The view snapshot with manual-layout
 * @returns The snapshot with the next view applied
 */
export function applyManualLayout<
  V extends LayoutedView,
>(
  autoLayouted: V,
  snapshot: ViewManualLayoutSnapshot,
): V {
  invariant(autoLayouted.id === snapshot.id, 'applyManualLayout: view ids do not match')
  invariant(autoLayouted._stage === 'layouted', 'applyManualLayout: expected layouted view')
  invariant(autoLayouted._layout !== 'manual', 'applyManualLayout: expected auto-layouted view')

  const drifts: LayoutedViewDriftReason[] = []

  if (autoLayouted._type !== snapshot._type) {
    drifts.push('type-changed')
  }

  const nextNodes = new Map(autoLayouted.nodes.map(n => [n.id, n]))
  const nextEdges = new Map(autoLayouted.edges.map(e => [e.id, e]))

  const nextNodeIds = new Set(nextNodes.keys())
  const nextEdgeIds = new Set(nextEdges.keys())

  const snapshotNodeIds = new Set(snapshot.nodes.map(n => n.id))
  const snapshotEdgeIds = new Set(snapshot.edges.map(e => e.id))

  if (difference(nextNodeIds, snapshotNodeIds).size > 0) {
    drifts.push('includes-more-nodes')
  }
  if (difference(nextEdgeIds, snapshotEdgeIds).size > 0) {
    drifts.push('includes-more-edges')
  }
  if (symmetricDifference(nextNodeIds, snapshotNodeIds).size > 0) {
    drifts.push('nodes-drift')
  }
  if (symmetricDifference(nextEdgeIds, snapshotEdgeIds).size > 0) {
    drifts.push('edges-drift')
  }

  const nodes = snapshot.nodes.map(node => {
    const next = nextNodes.get(node.id)
    if (!next) {
      return node
    }
    return produce(node, draft => {
      draft.color = next.color
      draft.kind = next.kind
      // Update title if next node has a shorter title
      if (next.title.length <= draft.title.length) {
        draft.title = next.title
      }

      if (next.navigateTo) {
        draft.navigateTo = next.navigateTo
      }

      // TODO check modelRef/deploymentRef
      // The following properties are updated only if the node from the snapshot
      // is same size or larger than the node from auto-layouted view
      if (!BBox.includes(BBox.expand(node, MAX_ALLOWED_DRIFT), next)) {
        return
      }
      draft.shape = next.shape

      if (next.icon !== draft.icon) {
        draft.icon = next.icon ?? 'none'
      }

      // We fit next node into the current node
      // Safe to update title, description, notation, technology
      draft.title = next.title
      if (!isShallowEqual(draft.description, next.description)) {
        draft.description = next.description ?? null
      }
      if (draft.notation !== next.notation) {
        draft.notation = next.notation ?? null
      }
      if (draft.technology !== next.technology) {
        draft.technology = next.technology ?? null
      }

      // The following properties are safe to update
      // (ignoring size / text size / padding)
      const safeStyle = pick(next.style, ['border', 'opacity', 'multiple'])
      if (!hasSubObject(node.style, safeStyle)) {
        draft.style = {
          ...node.style,
          ...safeStyle,
        }
      }

      if (!isShallowEqual(draft.tags, next.tags)) {
        draft.tags = [...next.tags]
      }
    })
  })

  const edges = snapshot.edges.map(edge => {
    const next = nextEdges.get(edge.id)
    if (!next || next.source !== edge.source || next.target !== edge.target) {
      return edge
    }

    return produce(edge, draft => {
      draft.color = next.color
    })
  })

  let nodeNotations = isShallowEqual(snapshot.nodes, nodes) ? snapshot.notation?.nodes : buildElementNotations(nodes)

  return {
    ...autoLayouted,
    ...(snapshot as V),
    title: autoLayouted.title,
    description: autoLayouted.description,
    tags: autoLayouted.tags,
    links: autoLayouted.links,
    [_type]: snapshot._type,
    [_layout]: 'manual',
    hash: snapshot.hash,
    bounds: snapshot.bounds,
    autoLayout: snapshot.autoLayout,
    ...(nodeNotations && nodeNotations.length > 0 ? { notation: { nodes: nodeNotations } } : {}),
    nodes,
    edges,
    drifts,
  }
}
