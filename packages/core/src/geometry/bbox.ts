import { hasAtLeast } from 'remeda'
import { invariant } from '../utils/invariant'
import type { Point, XYPoint } from './types'

// Bounding box
export interface BBox {
  x: number
  y: number
  width: number
  height: number
}

export namespace BBox {
  export function center({ x, y, width, height }: BBox): XYPoint {
    return {
      x: x + width / 2,
      y: y + height / 2,
    }
  }

  /**
   * Returns the four corner points of the box in clockwise order starting from top-left
   */
  export function toPoints({ x, y, width, height }: BBox): [XYPoint, XYPoint, XYPoint, XYPoint] {
    return [
      { x, y }, // Top left
      { x: x + width, y }, // Top right
      { x: x + width, y: y + height }, // Bottom right
      { x, y: y + height }, // Bottom left
    ]
  }

  export function fromPoints(points: Point[]): BBox {
    const { x1, y1, x2, y2 } = RectBox.fromPoints(points)
    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
    }
  }

  export function merge(...boxes: BBox[]): BBox {
    invariant(hasAtLeast(boxes, 1), 'No boxes provided')
    if (boxes.length === 1) {
      return boxes[0]
    }
    let minX = boxes[0].x
    let minY = boxes[0].y
    let maxX = boxes[0].x + boxes[0].width
    let maxY = boxes[0].y + boxes[0].height
    for (let i = 1; i < boxes.length; i++) {
      const box = boxes[i]!
      minX = Math.min(minX, box.x)
      minY = Math.min(minY, box.y)
      maxX = Math.max(maxX, box.x + box.width)
      maxY = Math.max(maxY, box.y + box.height)
    }
    return {
      x: Math.floor(minX),
      y: Math.floor(minY),
      width: Math.round(maxX - minX),
      height: Math.round(maxY - minY),
    }
  }

  export function fromRectBox(rect: RectBox): BBox {
    return {
      x: Math.min(rect.x1, rect.x2),
      y: Math.min(rect.y1, rect.y2),
      width: Math.abs(rect.x2 - rect.x1),
      height: Math.abs(rect.y2 - rect.y1),
    }
  }

  export function toRectBox(box: BBox): RectBox {
    return {
      x1: box.x,
      y1: box.y,
      x2: box.x + box.width,
      y2: box.y + box.height,
    }
  }

  export function expand(box: BBox, plus: number): BBox {
    if (plus === 0) {
      return box
    }
    return {
      x: box.x - plus,
      y: box.y - plus,
      width: box.width + plus * 2,
      height: box.height + plus * 2,
    }
  }

  export function shrink(box: BBox, minus: number): BBox {
    if (minus === 0) {
      return box
    }
    return {
      x: box.x + minus,
      y: box.y + minus,
      width: box.width - minus * 2,
      height: box.height - minus * 2,
    }
  }

  /**
   * Returns true if `a` includes `b` (i.e. `b` is inside `a`)
   */
  export function includes(a: BBox, b: BBox): boolean {
    if (a === b) {
      return true
    }
    return a.x <= b.x && a.y <= b.y && (a.x + a.width) >= (b.x + b.width) && (a.y + a.height) >= (b.y + b.height)
  }
}

export interface RectBox {
  // Top left
  x1: number
  y1: number
  // Bottom right
  x2: number
  y2: number
}

export namespace RectBox {
  export function center({ x1, y1, x2, y2 }: RectBox): XYPoint {
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    }
  }

  export function fromPoints(points: Point[]): RectBox {
    invariant(points.length > 0, 'At least one point is required')
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of points) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
    return {
      x1: minX,
      y1: minY,
      x2: maxX,
      y2: maxY,
    }
  }

  export function merge(...boxes: RectBox[]): RectBox {
    invariant(boxes.length > 0, 'No boxes provided')
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const box of boxes) {
      minX = Math.min(minX, box.x1)
      minY = Math.min(minY, box.y1)
      maxX = Math.max(maxX, box.x2)
      maxY = Math.max(maxY, box.y2)
    }
    return {
      x1: minX,
      y1: minY,
      x2: maxX,
      y2: maxY,
    }
  }

  export function toBBox(box: RectBox): BBox {
    return {
      x: box.x1,
      y: box.y1,
      width: box.x2 - box.x1,
      height: box.y2 - box.y1,
    }
  }

  /**
   * Returns true if `a` includes `b` (i.e. `b` is inside `a`)
   */
  export function includes(a: RectBox, b: RectBox): boolean {
    if (a === b) {
      return true
    }
    return a.x1 <= b.x1 && a.y1 <= b.y1 && a.x2 >= b.x2 && a.y2 >= b.y2
  }
}
