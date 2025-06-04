import { invariant } from '../errors'

export type Point = readonly [x: number, y: number]

export interface XYPoint {
  x: number
  y: number
}

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
    invariant(boxes.length > 0, 'No boxes provided')
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const box of boxes) {
      minX = Math.min(minX, box.x)
      minY = Math.min(minY, box.y)
      maxX = Math.max(maxX, box.x + box.width)
      maxY = Math.max(maxY, box.y + box.height)
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
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
}
