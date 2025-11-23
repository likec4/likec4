import { type DiagramEdge, type DynamicViewDisplayVariant, type LayoutedView, BBox } from '@likec4/core/types'

/**
 * Picks appropriate bounds from the view,
 * depending on its type and dynamic variant
 */
export function pickViewBounds(view: LayoutedView, dynamicVariant?: DynamicViewDisplayVariant) {
  if (view._type === 'dynamic') {
    try {
      dynamicVariant ??= view.variant
      if (dynamicVariant === 'sequence') {
        return view.sequenceLayout.bounds
      }
    } catch {
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
      ...edges.map(calcEdgeBounds),
    ),
    10,
  )
}
