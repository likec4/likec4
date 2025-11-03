import { type WritableDraft, produce } from 'immer'
import { hasAtLeast, isDeepEqual, isNullish, isNumber, isTruthy } from 'remeda'
import type { Writable } from 'type-fest'
import { buildElementNotations } from '../../compute-view/utils/buildElementNotations'
import {
  type DiagramEdge,
  type DiagramEdgeDriftReason,
  type DiagramNode,
  type DiagramNodeDriftReason,
  type LayoutedDynamicView,
  type LayoutedView,
  type LayoutedViewDriftReason,
  type ViewManualLayoutSnapshot,
  _layout,
  isDynamicView,
} from '../../types'
import { invariant, symmetricDifference } from '../../utils'

const changed = (a: unknown, b: unknown) => {
  if (a === b || (isNullish(a) && isNullish(b))) {
    return false
  }
  return !isDeepEqual(a, b)
}

/**
 * Maximum allowed drift per coordinate (top, left, bottom, right)
 */
const MAX_ALLOWED_DRIFT = 5

/**
 * 'Safely' applies non-drifting properties from `next` to `draft`.
 * Used to auto-apply certain properties that are not considered drifting.
 */
function autoApplyMetaAndStyles(
  draft: WritableDraft<DiagramNode>,
  next: DiagramNode,
) {
  // Always auto-apply these properties
  draft.color = next.color
  draft.kind = next.kind
  draft.navigateTo = next.navigateTo ?? null
  draft.links = next.links ? [...next.links] : null
  draft.tags = [...next.tags]

  // We consider the following properties as potentially drifting
  // - size
  // - textSize
  // - padding
  // So we auto-apply changes to properties
  // - border
  // - opacity
  // - multiple
  if (isNullish(next.style.border)) {
    delete draft.style.border
  } else {
    draft.style.border = next.style.border
  }

  if (isNumber(next.style.opacity)) {
    draft.style.opacity = next.style.opacity
  } else {
    delete draft.style.opacity
  }

  if (isNullish(next.style.multiple)) {
    delete draft.style.multiple
  } else {
    draft.style.multiple = next.style.multiple
  }
}

/**
 * Auto-applies icon changes according to the rules:
 * - If icon was set before and changed, auto-apply
 * - If icon was set before and now removed, auto-apply
 * - If icon was added, only auto-apply if size not changed
 * @returns true if icon was auto-applied, false otherwise
 */
function autoApplyIcon(
  draft: WritableDraft<DiagramNode>,
  next: DiagramNode,
  sizeNotChanged: boolean,
): boolean {
  if (changed(next.icon ?? 'none', draft.icon ?? 'none')) {
    const iconWasSet = isTruthy(draft.icon) && draft.icon !== 'none'
    switch (true) {
      // Icon was set before and changed, auto-apply
      case iconWasSet && isTruthy(next.icon) && next.icon !== 'none': {
        draft.icon = next.icon
        return true
      }
      // Icon was set before and now removed, auto-apply
      case iconWasSet && (isNullish(next.icon) || next.icon === 'none'): {
        draft.icon = 'none'
        return true
      }
      // Icon was added
      case !iconWasSet && isTruthy(next.icon) && next.icon !== 'none': {
        // Only auto-apply if size not changed, and compound state not changed
        if (sizeNotChanged) {
          draft.icon = next.icon
          return true
        } else {
          return false
        }
      }
    }
  }
  return true
}

/**
 * Auto-applies title, description, technology to leaf node
 * @returns true if all labels were auto-applied, false otherwise
 */
function autoApplyLabelsToLeaf(
  draft: WritableDraft<DiagramNode>,
  next: DiagramNode,
  sizeNotChanged: boolean,
) {
  let applied = true
  if (changed(draft.title, next.title)) {
    if (sizeNotChanged) {
      draft.title = next.title
    } else {
      applied = false
    }
  }

  if (changed(draft.description, next.description)) {
    if (isNullish(next.description)) {
      delete draft.description
    } else if (sizeNotChanged) {
      draft.description = next.description
    } else {
      applied = false
    }
  }
  if (changed(draft.technology, next.technology)) {
    if (isNullish(next.technology)) {
      delete draft.technology
    } else if (sizeNotChanged) {
      draft.technology = next.technology
    } else {
      applied = false
    }
  }
  return applied
}

/**
 * Auto-applies title, description, technology to compound node
 * Currently always updates properties
 */
function autoApplyLabelsToCompound(
  draft: WritableDraft<DiagramNode>,
  next: DiagramNode,
  _sizeNotChanged: boolean,
): boolean {
  draft.title = next.title

  if (isNullish(next.description)) {
    delete draft.description
  } else {
    draft.description = next.description
  }

  if (isNullish(next.technology)) {
    delete draft.technology
  } else {
    draft.technology = next.technology
  }

  return true
}

/**
 * Proof-of-concept
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
        // TODO: node is missing in the next layout, update node with data from the model?
        draft.drifts = ['missing']
        return
      }

      autoApplyMetaAndStyles(draft, next)

      const nodeDrifts = new Set<DiagramNodeDriftReason>()

      const wasCompound = node.children.length > 0
      const willBeCompound = next.children.length > 0

      // Should not happen, but just in case check for drifts in model/deployment refs
      if (changed(draft.modelRef, next.modelRef) || changed(draft.deploymentRef, next.deploymentRef)) {
        nodeDrifts.add('modelRef-changed')
      }

      // Check for compound/leaf changes
      if (willBeCompound && !wasCompound) {
        nodeDrifts.add('became-compound')
      }
      if (!willBeCompound && wasCompound) {
        nodeDrifts.add('became-leaf')
      }

      if (changed(draft.parent, next.parent)) {
        nodeDrifts.add('parent-changed')
      }

      // Node size is considered changed if only it became larger than allowed drift
      const sizeNotChanged = draft.width + MAX_ALLOWED_DRIFT >= next.width
        && draft.height + MAX_ALLOWED_DRIFT >= next.height

      if (changed(draft.shape, next.shape)) {
        // Auto-apply shape only if size not changed
        if (sizeNotChanged) {
          draft.shape = next.shape
        } else {
          nodeDrifts.add('shape-changed')
        }
      }

      // Only auto-apply if size not changed, and compound state not changed
      if (!autoApplyIcon(draft, next, sizeNotChanged && willBeCompound === wasCompound)) {
        nodeDrifts.add('label-changed')
      }

      const autoApplyLabels = wasCompound ? autoApplyLabelsToCompound : autoApplyLabelsToLeaf
      if (!autoApplyLabels(draft, next, sizeNotChanged)) {
        nodeDrifts.add('label-changed')
      }

      if (changed(node.notation, next.notation)) {
        draft.notation = next.notation ?? null
      }

      if (
        wasCompound && willBeCompound
        && symmetricDifference(new Set(node.children), new Set(next.children)).size > 0
      ) {
        nodeDrifts.add('children-changed')
      }

      const _drifts = [...nodeDrifts]
      if (hasAtLeast(_drifts, 1)) {
        // Propagate to view drifts
        viewDrifts.add('nodes-mismatch')
        draft.drifts = _drifts
      }
    })
  })

  const edges = snapshot.edges.map((edge): DiagramEdge => {
    const next = nextEdges.get(edge.id)
    return produce(edge, draft => {
      if (!next) {
        draft.drifts = ['missing']
        return
      }
      const edgeDrifts = new Set<DiagramEdgeDriftReason>()

      if (draft.source === next.target && draft.target === next.source) {
        edgeDrifts.add('direction-changed')
      } else {
        if (draft.source !== next.source) {
          edgeDrifts.add('source-changed')
        }
        if (draft.target !== next.target) {
          edgeDrifts.add('target-changed')
        }
      }

      // Only check size if previous checks passed
      if (edgeDrifts.size === 0 && changed(draft.dir ?? 'forward', next.dir ?? 'forward')) {
        edgeDrifts.add('direction-changed')
      }

      draft.color = next.color
      draft.line = next.line
      draft.navigateTo = next.navigateTo ?? null
      draft.tags = next.tags ? [...next.tags] : null

      if (isNullish(next.notes)) {
        delete draft.notes
      } else {
        draft.notes = next.notes
      }

      if (next.astPath) {
        draft.astPath = next.astPath
      }

      if (next.labelBBox) {
        if (!draft.labelBBox || (!isTruthy(draft.label) && isTruthy(next.label))) {
          edgeDrifts.add('label-changed')
        }
        draft.labelBBox = {
          // Preserve x,y if possible
          x: draft.labelBBox?.x ?? next.labelBBox.x,
          y: draft.labelBBox?.y ?? next.labelBBox.y,
          // Take width/height from next
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

  const nodeNotations = buildElementNotations(nodes)

  const result = { ...snapshot } as Writable<LayoutedView>
  Object.assign(
    result,
    {
      // Auto-layouted properties
      title: autoLayouted.title ?? snapshot.title,
      description: autoLayouted.description ?? snapshot.description,
      tags: autoLayouted.tags ? [...autoLayouted.tags] : null,
      links: autoLayouted.links ? [...autoLayouted.links] : null,
      [_layout]: 'manual' as const,
      ...(nodeNotations && nodeNotations.length > 0 ? { notation: { nodes: nodeNotations } } : {}),
      nodes,
      edges,
    } satisfies Partial<LayoutedView>,
  )

  if (isDynamicView(autoLayouted) && result._type === 'dynamic') {
    Object.assign(
      result,
      {
        variant: autoLayouted.variant,
      } satisfies Partial<LayoutedDynamicView>,
    )
  }

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
