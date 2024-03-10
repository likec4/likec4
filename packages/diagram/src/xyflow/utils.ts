import type { XYPosition } from '@xyflow/react'

export function toDomPrecision(v: number | null) {
  if (v === null) {
    return 0.01
  }
  return Math.round(v * 100) / 100
}

export function distance(a: XYPosition, b: XYPosition) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}
