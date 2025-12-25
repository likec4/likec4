import { type WritableDraft, produce } from 'immer'
import { hasAtLeast, isDeepEqual, isNullish, isNumber, isTruthy, pick, pipe } from 'remeda'
import type { Writable } from 'type-fest'
import { buildElementNotations } from '../compute-view/utils/buildElementNotations'
import {
  type DiagramEdge,
  type DiagramEdgeDriftReason,
  type DiagramNode,
  type DiagramNodeDriftReason,
  type LayoutedDynamicView,
  type LayoutedView,
  type LayoutedViewDriftReason,
  type MarkdownOrString,
  type ViewManualLayoutSnapshot,
  _layout,
  isDynamicView,
} from '../types'
import { ifilter, ihead, invariant, symmetricDifference } from '../utils'

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

function patchMarkdownOrString(
  draft: WritableDraft<MarkdownOrString> | undefined | null,
  next: MarkdownOrString,
): MarkdownOrString {
  if (!draft) {
    return next
  }
  if ('md' in next) {
    draft.md = next.md
    delete draft.txt
    return draft
  }
  if ('txt' in next) {
    draft.txt = next.txt
    delete draft.md
  }
  return draft
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
      draft.description = patchMarkdownOrString(
        draft.description,
        next.description,
      )
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
    draft.description = patchMarkdownOrString(
      draft.description,
      next.description,
    )
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

  const nodes = applyNodesManualLayout(snapshot.nodes, nextNodes, viewDrifts)
  const edges = applyEdgesManualLayout(snapshot.edges, nextEdges, viewDrifts)

  const nodeNotations = buildElementNotations(nodes)

  // Shallow copy of snapshot
  const result: V = Object.assign(
    { ...snapshot } as unknown as V,
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
    ;(result as Writable<LayoutedDynamicView>).variant = autoLayouted.variant
  }

  const writableV = result as Writable<V>
  const drifts = [...viewDrifts]
  if (hasAtLeast(drifts, 1)) {
    writableV.drifts = drifts
  } else {
    // Clear drifts if any comes from `autoLayouted` or `snapshot`
    // Should not happen, but just in case
    if ('drifts' in writableV) {
      delete writableV.drifts
    }
  }

  return result
}

function applyNodesManualLayout(
  snapshotNodes: ReadonlyArray<DiagramNode>,
  nextNodes: Map<DiagramNode['id'], DiagramNode>,
  viewDrifts: Set<LayoutedViewDriftReason>,
): ReadonlyArray<DiagramNode> {
  const nodes = snapshotNodes.map((node): DiagramNode => {
    const next = nextNodes.get(node.id)
    if (next) {
      nextNodes.delete(next.id)
    }
    return produce(node, draft => {
      if (!next) {
        // TODO: node is missing in the next layout, update node with data from the model?
        draft.drifts = ['removed']
        viewDrifts.add('nodes-removed')
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
        viewDrifts.add('nodes-drift')
        draft.drifts = _drifts
      } else {
        // Clear drifts if any comes from `snapshot`
        delete draft.drifts
      }
    })
  })

  if (nextNodes.size > 0) {
    // Some next nodes were not processed, meaning they were added
    viewDrifts.add('nodes-added')
  }

  return nodes
}

function applyEdgesManualLayout(
  snapshotEdges: ReadonlyArray<DiagramEdge>,
  nextEdges: Map<DiagramEdge['id'], DiagramEdge>,
  viewDrifts: Set<LayoutedViewDriftReason>,
): ReadonlyArray<DiagramEdge> {
  const edges = snapshotEdges.map((edge): DiagramEdge => {
    let next = nextEdges.get(edge.id) ?? pipe(
      nextEdges.values(),
      ifilter(e => e.source === edge.source && e.target === edge.target),
      ihead(),
    )
    if (next) {
      nextEdges.delete(next.id)
    }

    return produce(edge, draft => {
      if (!next) {
        draft.drifts = ['removed']
        viewDrifts.add('edges-removed')
        return
      }
      const edgeDrifts = new Set<DiagramEdgeDriftReason>()

      const isSameId = edge.id === next.id

      switch (true) {
        // IDs match, but source/target may have changed
        case isSameId
          && edge.source == next.source
          && edge.target == next.target: {
          // IDs and source/target match, check for direction change
          if (changed(draft.dir ?? 'forward', next.dir ?? 'forward')) {
            edgeDrifts.add('direction-changed')
          }
          break
        }
        case isSameId
          && edge.source == next.target
          && edge.target == next.source: {
          // Check it is not a self-loop
          if (edge.source !== edge.target) {
            edgeDrifts.add('direction-changed')
          }
          break
        }
        case isSameId: {
          if (edge.source != next.source) {
            edgeDrifts.add('source-changed')
          }
          if (edge.target != next.target) {
            edgeDrifts.add('target-changed')
          }
          // ignore direction change in this case
          break
        }
        default: {
          invariant(edge.id != next.id, 'Unexpected case in edge drift detection, ids should not match')
          invariant(edge.source == next.source, 'Unexpected case in edge drift detection, sources should match')
          invariant(edge.target == next.target, 'Unexpected case in edge drift detection, targets should match')
          if (changed(draft.dir ?? 'forward', next.dir ?? 'forward')) {
            edgeDrifts.add('direction-changed')
          }
          break
        }
      }

      draft.color = next.color
      draft.line = next.line
      draft.navigateTo = next.navigateTo ?? null
      draft.tags = next.tags ? [...next.tags] : null

      if (changed(edge.notes, next.notes)) {
        // If notes was added/removed - consider it drifted
        if (isNullish(edge.notes) !== isNullish(next.notes)) {
          edgeDrifts.add('notes-changed')
        }
        // Keep old notes if removed
        draft.notes = next.notes ?? edge.notes!
      }

      if (next.astPath) {
        draft.astPath = next.astPath
      } else {
        delete draft.astPath
      }

      const labelsBefore = pick(edge, ['label', 'description', 'technology', 'labelBBox'])
      const labelsAfter = pick(next, ['label', 'description', 'technology', 'labelBBox'])
      if (changed(labelsBefore, labelsAfter)) {
        switch (true) {
          case next.labelBBox && !edge.labelBBox: {
            // Label added, consider it drifted
            edgeDrifts.add('label-added')
            break
          }
          case edge.labelBBox && !next.labelBBox: {
            // Add detect drift
            edgeDrifts.add('label-removed')
            break
          }
          case !!edge.labelBBox && !!next.labelBBox: {
            // Both have labelBBox, check for changes below
            const sizeChanged = next.labelBBox.width * next.labelBBox.height >
              (edge.labelBBox.width + MAX_ALLOWED_DRIFT) * (edge.labelBBox.height + MAX_ALLOWED_DRIFT)

            if (sizeChanged) {
              // Take width/height from next
              draft.labelBBox!.width = Math.round(next.labelBBox.width)
              draft.labelBBox!.height = Math.round(next.labelBBox.height)
            }
            if (changed(edge.label, next.label)) {
              // If label was added/removed - consider it drifted
              if (isNullish(next.label) !== isNullish(edge.label)) {
                edgeDrifts.add('label-changed')
              }
              // Keep old label if it was removed
              draft.label = next.label ?? edge.label
            }

            if (changed(edge.description, next.description)) {
              // If description was added/removed
              if (isNullish(next.description) !== isNullish(edge.description)) {
                edgeDrifts.add('label-changed')
              }
              if (next.description) {
                draft.description = patchMarkdownOrString(
                  edge.description,
                  next.description,
                )
              }
            }
            if (changed(edge.technology, next.technology)) {
              // If technology was added/removed
              if (isNullish(next.technology) !== isNullish(edge.technology)) {
                edgeDrifts.add('label-changed')
              }
              // Take old technology if removed
              draft.technology = next.technology ?? edge.technology ?? null
            }

            break
          }
          default:
            invariant(!edge.labelBBox, 'Unexpected case in edge labelBBox drift detection')
            invariant(!next.labelBBox, 'Unexpected case in next labelBBox drift detection')
            // Both don't have labelBBox, nothing to do
            break
        }
      }

      const _drifts = [...edgeDrifts]
      if (hasAtLeast(_drifts, 1)) {
        viewDrifts.add('edges-drift')
        draft.drifts = _drifts
      } else {
        // Clear drifts if any comes from `snapshot`
        delete draft.drifts
      }
    })
  })

  if (nextEdges.size > 0) {
    // Some next edges were not processed, meaning they were added
    viewDrifts.add('edges-added')
  }

  return edges
}
