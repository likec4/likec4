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
