import { type NonEmptyArray } from '@likec4/core';
import { type Dimensions, type XYPoint, BBox } from '@likec4/core/geometry';
import type { InternalNode as RFInternalNode, OnNodeDrag } from '@xyflow/react';
import { type XYStoreApi } from '../hooks';
import type { Types } from './types';
type InternalNode = RFInternalNode<Types.AnyNode>;
declare abstract class Rect {
    static readonly LeftPadding = 42;
    static readonly RightPadding = 42;
    static readonly TopPadding = 60;
    static readonly BottomPadding = 42;
    id: string;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    readonly initial: BBox;
    get positionAbsolute(): XYPoint;
    set positionAbsolute(pos: XYPoint);
    get dimensions(): Dimensions;
    get diff(): XYPoint;
    get isMoved(): boolean;
    get isResized(): boolean;
    get position(): XYPoint;
    protected abstract parent: CompoundRect | null;
    constructor(xynode: InternalNode, parent?: CompoundRect | null);
}
declare class CompoundRect extends Rect {
    readonly parent: CompoundRect | null;
    readonly children: Rect[];
    constructor(xynode: InternalNode, parent?: CompoundRect | null);
}
declare class Leaf extends Rect {
    readonly parent: CompoundRect | null;
    constructor(xynode: InternalNode, parent?: CompoundRect | null);
}
export declare function createLayoutConstraints(xyflowApi: XYStoreApi, editingNodeIds: NonEmptyArray<string>): {
    rects: ReadonlyMap<string, Leaf | CompoundRect>;
    onMove: () => void;
    updateXYFlow: () => void;
    hasChanges: () => boolean;
    cancelPending: () => void;
    flushPending: () => void;
};
type LayoutConstraints = {
    onNodeDragStart: OnNodeDrag<Types.Node>;
    onNodeDrag: OnNodeDrag<Types.Node>;
    onNodeDragStop: OnNodeDrag<Types.Node>;
};
/**
 * Keeps the layout constraints (parent nodes and children) when dragging a node
 */
export declare function useLayoutConstraints(): LayoutConstraints;
export {};
