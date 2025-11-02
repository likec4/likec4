import { produce } from 'immer'
import { hasAtLeast, hasSubObject, isDeepEqual, isNullish, pick } from 'remeda'
import type { Writable } from 'type-fest'
import { buildElementNotations } from '../../compute-view/utils/buildElementNotations'
import {
  type DiagramEdge,
  type DiagramEdgeDriftReason,
  type DiagramNode,
  type DiagramNodeDriftReason,
  type LayoutedView,
  type LayoutedViewDriftReason,
  type ViewManualLayoutSnapshot,
  _layout,
} from '../../types'
import { invariant, symmetricDifference } from '../../utils'

const eq = (a: unknown, b: unknown) => {
  if (isNullish(a) && isNullish(b)) {
    return true
  }
  return isDeepEqual(a, b)
}

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
  invariant(snapshot._stage === 'layouted', 'applyManualLayout: expected layouted snapshot')
  invariant(autoLayouted._layout !== 'manual', 'applyManualLayout: expected auto-layouted view')

  const viewDrifts = new Set<LayoutedViewDriftReason>()

  if (autoLayouted._type !== snapshot._type) {
    viewDrifts.add('type-changed')
  }

  const nextNodes = new Map(autoLayouted.nodes.map(n => [n.id, n]))
  const nextEdges = new Map(autoLayouted.edges.map(e => [e.id, e]))

  const nextNodeIds = new Set(nextNodes.keys())
  const nextEdgeIds = new Set(nextEdges.keys())

  const snapshotNodeIds = new Set(snapshot.nodes.map(n => n.id))
  const snapshotEdgeIds = new Set(snapshot.edges.map(e => e.id))

  if (symmetricDifference(nextNodeIds, snapshotNodeIds).size > 0) {
    viewDrifts.add('nodes-mismatch')
  }
  if (symmetricDifference(nextEdgeIds, snapshotEdgeIds).size > 0) {
    viewDrifts.add('edges-mismatch')
  }

  const nodes = snapshot.nodes.map((node): DiagramNode => {
    const next = nextNodes.get(node.id)
    return produce(node, draft => {
      if (!next) {
        draft.drifts = ['not-exists']
        return
      }
      const nodeDrifts = new Set<DiagramNodeDriftReason>()

      // Always update
      draft.color = next.color
      draft.kind = next.kind
      draft.navigateTo = next.navigateTo ?? null
      draft.links = next.links ? [...next.links] : null
      draft.tags = [...next.tags]

      if (!eq(node.modelRef, next.modelRef) || !eq(node.deploymentRef, next.deploymentRef)) {
        nodeDrifts.add('modelRef-changed')
      }

      if (next.children.length > 0 && node.children.length === 0) {
        nodeDrifts.add('become-compound')
      }
      if (next.children.length === 0 && node.children.length > 0) {
        nodeDrifts.add('become-leaf')
      }

      if (!eq(node.parent, next.parent)) {
        nodeDrifts.add('parent-changed')
      }

      // Size is considered changed if only it became larger than allowed drift
      const sizeNotChanged = node.width + MAX_ALLOWED_DRIFT >= next.width
        && node.height + MAX_ALLOWED_DRIFT >= next.height

      if (node.shape !== next.shape) {
        if (sizeNotChanged) {
          draft.shape = next.shape
        } else {
          nodeDrifts.add('shape-changed')
        }
      }

      if (!eq(next.icon, node.icon)) {
        // Only update icon if only it was set before
        if (node.icon && node.icon !== 'none') {
          if (next.icon && next.icon !== 'none') {
            draft.icon = next.icon
          }
          // Or icon was removed
          else if (!next.icon || next.icon === 'none') {
            draft.icon = 'none'
          } else {
            nodeDrifts.add('label-changed')
          }
          // Or icon was set, but does not affect size
        } else if (sizeNotChanged && next.icon && next.icon !== 'none') {
          draft.icon = next.icon
        } else {
          nodeDrifts.add('label-changed')
        }
      }

      if (next.title !== node.title) {
        if (sizeNotChanged) {
          draft.title = next.title
        } else {
          draft.title = next.title.slice(0, node.title.length)
          if (next.title.length > node.title.length) {
            nodeDrifts.add('label-changed')
          }
        }
      }

      if (!eq(draft.description, next.description)) {
        if (sizeNotChanged) {
          draft.description = next.description ?? null
        } else {
          nodeDrifts.add('label-changed')
        }
      }
      if (!eq(draft.technology, next.technology)) {
        if (sizeNotChanged) {
          draft.technology = next.technology ?? null
        } else {
          nodeDrifts.add('label-changed')
        }
      }
      if (!eq(node.notation, next.notation)) {
        draft.notation = next.notation ?? null
      }

      if (symmetricDifference(new Set(node.inEdges), new Set(next.inEdges)).size > 0) {
        nodeDrifts.add('relationships-changed')
      } else if (symmetricDifference(new Set(node.outEdges), new Set(next.outEdges)).size > 0) {
        nodeDrifts.add('relationships-changed')
      }

      if (symmetricDifference(new Set(node.children), new Set(next.children)).size > 0) {
        nodeDrifts.add('children-changed')
      }

      // Propagate to view drifts
      if (nodeDrifts.size > 0) {
        viewDrifts.add('nodes-mismatch')
      }

      // The following properties are considered safe to update only if no other drifts detected
      if (!sizeNotChanged) {
        nodeDrifts.add('size-changed')
      }
      if (node.x !== next.x || node.y !== next.y) {
        nodeDrifts.add('position-changed')
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

      const _drifts = [...nodeDrifts]
      if (hasAtLeast(_drifts, 1)) {
        draft.drifts = _drifts
      }
    })
  })

  const edges = snapshot.edges.map((edge): DiagramEdge => {
    const next = nextEdges.get(edge.id)
    return produce(edge, draft => {
      if (!next) {
        draft.drifts = ['not-exists']
        return
      }
      const edgeDrifts = new Set<DiagramEdgeDriftReason>()

      if (edge.source === next.target && edge.target === next.source) {
        edgeDrifts.add('direction-changed')
      } else {
        if (edge.source !== next.source) {
          edgeDrifts.add('source-changed')
        }
        if (edge.target !== next.target) {
          edgeDrifts.add('target-changed')
        }
      }

      // Only check size if previous checks passed
      if (edgeDrifts.size === 0 && !eq(edge.dir ?? 'forward', next.dir ?? 'forward')) {
        edgeDrifts.add('direction-changed')
      }

      draft.color = next.color
      draft.line = next.line
      draft.navigateTo = next.navigateTo ?? null
      draft.tags = next.tags ? [...next.tags] : null

      if (next.labelBBox) {
        if (!edge.labelBBox || edge.label !== next.label) {
          edgeDrifts.add('label-changed')
        }
        draft.labelBBox = {
          x: edge.labelBBox?.x ?? next.labelBBox.x,
          y: edge.labelBBox?.y ?? next.labelBBox.y,
          width: next.labelBBox.width,
          height: next.labelBBox.height,
        }
        draft.label = next.label
        draft.description = next.description ?? null
        draft.technology = next.technology ?? null
      } else if (edge.labelBBox) {
        // If previous edge had labelBBox but new one does not, consider it changed
        edgeDrifts.add('label-changed')
      }

      const _drifts = [...edgeDrifts]
      if (hasAtLeast(_drifts, 1)) {
        viewDrifts.add('edges-mismatch')
        draft.drifts = _drifts
      }
    })
  })

  let nodeNotations = buildElementNotations(nodes)

  const result: Writable<LayoutedView> = Object.assign(
    {},
    autoLayouted,
    snapshot,
    {
      title: autoLayouted.title ?? snapshot.title,
      description: autoLayouted.description ?? snapshot.description,
      tags: autoLayouted.tags ?? null,
      links: autoLayouted.links ?? null,
      [_layout]: 'manual' as const,
      ...(nodeNotations && nodeNotations.length > 0 ? { notation: { nodes: nodeNotations } } : {}),
      nodes,
      edges,
    } satisfies Partial<LayoutedView>,
  )

  const drifts = [...viewDrifts]
  if (hasAtLeast(drifts, 1)) {
    result.drifts = drifts
  } else {
    // Clear drifts if any comes from `autoLayouted` or `snapshot`
    // Should not happen, but just in case
    if ('drifts' in result) {
      delete result.drifts
    }
  }

  return result as V
}

/**
 * Applies drift reasons to autoLayouted view if there are any.
 */
export function applyLayoutDriftReasons<V extends LayoutedView>(
  autoLayouted: V,
  snapshot: ViewManualLayoutSnapshot,
): V {
  const { drifts } = applyManualLayout(autoLayouted, snapshot)
  if (drifts) {
    // Mutable for performance
    Object.assign(
      autoLayouted,
      {
        [_layout]: 'auto' as const,
        drifts,
      } satisfies Partial<LayoutedView>,
    )
  } else {
    const mutable = autoLayouted as Writable<LayoutedView>
    // Ensure no drifts present
    if ('drifts' in autoLayouted) {
      delete mutable.drifts
    }
  }
  return autoLayouted
}
