import { invariant } from '@likec4/core'
import { BBox } from '@likec4/core/geometry'
import type { DiagramEdge, DynamicViewDisplayVariant, LayoutedView } from '@likec4/core/types'

/**
 * Picks appropriate bounds from the view,
 * depending on its type and dynamic variant
 */
export function pickViewBounds(view: LayoutedView, dynamicVariant?: DynamicViewDisplayVariant): BBox {
  if (view._type === 'dynamic') {
    try {
      const variant = dynamicVariant ?? view.variant
      if (variant === 'sequence') {
        invariant(view.sequenceLayout, 'Sequence layout is not available')
        invariant(view.sequenceLayout.bounds, 'Sequence layout bounds are not available')
        return view.sequenceLayout.bounds
      }
    } catch (error) {
      console.error(error)
      // noop
    }
  }
  return view.bounds
}

export function calcEdgeBounds({ points, controlPoints, labelBBox }: DiagramEdge): BBox {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  // Prefer control points in bounds calculation if they exist
  if (controlPoints) {
    for (const p of controlPoints) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
  } else {
    for (const [x, y] of points) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (labelBBox) {
    minX = Math.min(minX, labelBBox.x)
    minY = Math.min(minY, labelBBox.y)
    maxX = Math.max(maxX, labelBBox.x + labelBBox.width)
    maxY = Math.max(maxY, labelBBox.y + labelBBox.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function calcViewBounds({ nodes, edges }: Pick<LayoutedView, 'nodes' | 'edges'>): BBox {
  return BBox.expand(
    BBox.merge(
      ...nodes,
      ...edges.map(calcEdgeBounds).filter(box => isFinite(box.x) && isFinite(box.y)),
    ),
    20,
  )
}
