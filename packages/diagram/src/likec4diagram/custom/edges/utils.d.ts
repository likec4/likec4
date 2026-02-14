import { type InternalNode, type XYPosition, Position } from '@xyflow/react';
export declare function getPointPosition(node: InternalNode, intersectionPoint: XYPosition): readonly [number, number, Position];
export declare function getEdgeParams(source: InternalNode, target: InternalNode): {
    sx: number;
    sy: number;
    tx: number;
    ty: number;
    sourcePos: Position;
    targetPos: Position;
};
