import type { Viewport } from '@xyflow/system'

/**
 * Viewport controlled by the diagram, when neither fit view nor initial zoom is set:
 * top-left corner of the view bounds at zoom 1.
 * Returns `undefined` when the viewport is left to the diagram actor.
 */
export function resolveControlledViewport(
  enableFitView: boolean,
  initialZoom: number | undefined,
  bounds: { x: number; y: number },
): Viewport | undefined {
  if (enableFitView || initialZoom !== undefined) {
    return undefined
  }
  return {
    x: -bounds.x,
    y: -bounds.y,
    zoom: 1,
  }
}

/**
 * Resolves whether an interaction (dragging, selection) is enabled:
 * the override wins over the default, and a busy editor disables it.
 */
export function resolveInteractionEnabled(
  enabled: boolean,
  override: boolean | undefined,
  isEditorBusy: boolean,
): boolean {
  return (override ?? enabled) && !isEditorBusy
}

/**
 * A plain click (no modifier key, no drag) on a node that is part of a multi-selection
 * should reduce the selection to that node only.
 */
export function shouldCollapseSelectionOnClick(params: {
  nodesSelectable: boolean
  isNodeSelected: boolean
  selectedNodesCount: number
  selectedEdgesCount: number
  hasModifierKey: boolean
  multiSelectionActive: boolean
  wasDragged: boolean
}): boolean {
  return params.nodesSelectable && params.isNodeSelected
    && !params.wasDragged && !params.hasModifierKey && !params.multiSelectionActive
    && params.selectedNodesCount + params.selectedEdgesCount > 1
}
