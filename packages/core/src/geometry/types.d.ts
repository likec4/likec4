export interface XYPoint {
    x: number;
    y: number;
}
export interface Dimensions {
    width: number;
    height: number;
}
export type Point = readonly [x: number, y: number];
export declare function isPoint(point: unknown): point is Point;
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
export declare function convertPoint(point: Point): XYPoint;
export declare function convertPoint(point: XYPoint): Point;
