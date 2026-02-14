import type { InternalNode, Rect, XYPosition } from '@xyflow/react';
export type GridAlignmentMode = 'Column' | 'Row';
export type LinearAlignmentMode = 'Left' | 'Center' | 'Right' | 'Top' | 'Middle' | 'Bottom';
export type AlignmentMode = LinearAlignmentMode | GridAlignmentMode;
export declare abstract class Aligner {
    abstract computeLayout(nodes: NodeRect[]): void;
    abstract applyPosition(node: NodeRect): Partial<XYPosition>;
}
export declare class LinearAligner extends Aligner {
    private getEdgePosition;
    private computePosition;
    private propertyToEdit;
    private alignTo;
    constructor(getEdgePosition: (nodes: NodeRect[]) => number, computePosition: (alignTo: number, node: NodeRect) => number, propertyToEdit: keyof XYPosition);
    computeLayout(nodes: NodeRect[]): void;
    applyPosition(node: NodeRect): Partial<XYPosition>;
}
export type NodeRect = Rect & {
    id: string;
};
export declare class GridAligner extends Aligner {
    private layout;
    private axisPreset;
    private get primaryAxisCoord();
    private get secondaryAxisCoord();
    private get primaryAxisDimension();
    private get secondaryAxisDimension();
    constructor(alignmentMode: GridAlignmentMode);
    applyPosition(node: NodeRect): Partial<XYPosition>;
    computeLayout(nodes: NodeRect[]): void;
    private getLayoutRect;
    private getLayers;
    private buildLayout;
    private buildLayerLayout;
    private spaceBetween;
    private spaceAround;
    private placeInGaps;
    private placeInCells;
    private scoreLayout;
    private getGapsPositions;
    private getNodePositions;
}
export declare function getLinearAligner(mode: LinearAlignmentMode): Aligner;
export declare function toNodeRect(node: InternalNode): NodeRect;
export declare function getAligner(mode: AlignmentMode): Aligner;
