import type { NonEmptyArray, Point } from '@likec4/core';
import { type XYPoint, BBox } from '@likec4/core/geometry';
import { type InternalNode, type Rect, type XYPosition, Position } from '@xyflow/react';
import { type NodeHandle, type Padding as XYFlowPadding } from '@xyflow/system';
import type { MouseEvent as ReactMouseEvent } from 'react';
export declare function distance(a: XYPosition, b: XYPosition): number;
/**
 * Minimal type to access only needed properties of InternalNode
 */
export type MinimalInternalNode = {
    internals: {
        positionAbsolute: XYPosition;
    };
    measured?: {
        width?: number;
        height?: number;
    };
    width?: number;
    height?: number;
    initialWidth?: number;
    initialHeight?: number;
};
/**
 * Extracts only the minimal properties from an InternalNode
 * needed for geometric calculations.
 *
 * @param nd - The InternalNode to extract from.
 * @returns An object containing only the necessary properties.
 */
export declare function extractMinimalInternalNode<N extends InternalNode>(nd: N): MinimalInternalNode;
export declare function isEqualMinimalInternalNodes(a: MinimalInternalNode, b: MinimalInternalNode): boolean;
export declare function isEqualRects(a: Rect, b: Rect): boolean;
export declare function nodeToRect(nd: MinimalInternalNode): Rect;
export declare function getNodeCenter(node: MinimalInternalNode): XYPosition;
/**
 * Helper function returns the intersection point
 * of the line between the center of the intersectionNode and the target
 *
 * @param intersectionNode the node that is the center of the line
 * @param target position of the target
 * @param nodeMargin the margin of the intersectionNode. The point will be placed at nodeMargin distance from the border of the node
 * @returns coordinates of the intersection point
 */
export declare function getNodeIntersectionFromCenterToPoint(intersectionNode: BBox, target: XYPosition, nodeMargin?: number): XYPosition;
/**
 * Helper function returns the intersection point
 * of the line between the center of the intersectionNode and the target
 *
 * @param intersectionNode the node that is the center of the line
 * @param targetNode the target node
 * @returns coordinates of the intersection point
 */
export declare function getNodeIntersection(intersectionNode: MinimalInternalNode, targetNode: MinimalInternalNode): XYPosition;
/**
 * Checks if a rectangle is completely inside another rectangle.
 *
 * @param test - The rectangle to test.
 * @param target - The target rectangle.
 * @returns `true` if the `test` rectangle is completely inside the `target` rectangle, otherwise `false`.
 */
export declare function isInside(test: Rect, target: Rect): boolean;
export declare function bezierControlPoints(points: NonEmptyArray<Point>): NonEmptyArray<XYPoint>;
/**
 * Checks if two points are the same, considering both XYPoint (object ) and Point (tuple) formats.
 * @returns `true` If points are within 2px
 */
export declare function isSamePoint(a: XYPosition | Point, b: XYPosition | Point): boolean;
export declare function distanceBetweenPoints(a: XYPosition, b: XYPosition): number;
export declare function stopPropagation(e: ReactMouseEvent): void;
export declare function bezierPath(bezierSpline: NonEmptyArray<Point>): string;
export declare function toXYFlowPosition(position: 'left' | 'right' | 'top' | 'bottom'): Position;
export declare function createXYFlowNodeNandles(bbox: BBox): NodeHandle[];
/**
 * Parses the paddings to an object with top, right, bottom, left, x and y paddings
 * @internal
 * @param padding - Padding to parse
 * @param width - Width of the viewport
 * @param height - Height of the viewport
 * @returns An object with the paddings in pixels
 */
export declare function parsePaddings(padding: XYFlowPadding, width: number, height: number): {
    top: number;
    bottom: number;
    left: number;
    right: number;
    x: number;
    y: number;
};
