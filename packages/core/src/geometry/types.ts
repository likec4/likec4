export interface XYPoint {
  x: number
  y: number
}
export interface Dimensions {
  width: number
  height: number
}

export type Point = readonly [x: number, y: number]

export function isPoint(point: unknown): point is Point {
  return Array.isArray(point) && point.length === 2 && typeof point[0] === 'number' && typeof point[1] === 'number'
}

/**
 * Converts between Point (tuple) and XYPoint (object) representations.
 *
 * @param point - The point to convert (either XYPoint or Point tuple)
 * @returns The converted point in the alternate format
 *
 * @example
 * ```ts
 * // Convert tuple to object
 * convertPoint([10, 20]) // returns { x: 10, y: 20 }
 *
 * // Convert object to tuple
 * convertPoint({ x: 10, y: 20 }) // returns [10, 20]
 * ```
 */
export function convertPoint(point: Point): XYPoint
export function convertPoint(point: XYPoint): Point
export function convertPoint(point: any) {
  if (isPoint(point)) {
    return { x: point[0], y: point[1] }
  }
  return [point.x, point.y] as const
}
