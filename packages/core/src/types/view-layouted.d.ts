import type { BBox, Point, XYPoint } from '../geometry';
import type * as aux from './_aux';
import type { AnyAux } from './_aux';
import type { NonEmptyArray, NonEmptyReadonlyArray } from './_common';
import type { _layout, _stage, _type } from './const';
import type { BaseViewProperties, ViewAutoLayout, ViewWithHash, ViewWithNotation } from './view-common';
import type { ComputedEdge, ComputedNode } from './view-computed';
import type { DiagramEdgeDriftReason, DiagramNodeDriftReason, LayoutedViewDriftReason } from './view-manual-layout';
import type { DynamicViewDisplayVariant } from './view-parsed.dynamic';
export interface DiagramNode<A extends AnyAux = AnyAux> extends ComputedNode<A>, BBox {
    /**
     * Absolute X coordinate
     */
    x: number;
    /**
     * Absolute Y coordinate
     */
    y: number;
    width: number;
    height: number;
    /**
     * Bounding box of label
     * (Absolute coordinates)
     */
    labelBBox: BBox;
    /**
     * List of reasons causing node drift
     */
    drifts?: NonEmptyReadonlyArray<DiagramNodeDriftReason> | null;
}
export interface DiagramEdge<A extends AnyAux = AnyAux> extends ComputedEdge<A> {
    /**
     * Bezier points
     * (Absolute coordinates)
     */
    points: NonEmptyArray<Point>;
    /**
     * Control points to adjust the edge
     * (Absolute coordinates)
     */
    controlPoints?: NonEmptyArray<XYPoint> | null;
    /**
     * Bounding box of label
     * (Absolute coordinates)
     */
    labelBBox?: BBox | null;
    /**
     * List of reasons causing edge drift
     */
    drifts?: NonEmptyReadonlyArray<DiagramEdgeDriftReason> | null;
}
/**
 * Type of the layout
 * - `auto`: auto-layouted from the current sources
 * - `manual`: read from the manually layouted snapshot
 */
export type LayoutType = 'auto' | 'manual';
interface BaseLayoutedViewProperties<A extends AnyAux> extends BaseViewProperties<A>, ViewWithHash, ViewWithNotation {
    readonly [_stage]: 'layouted';
    /**
     * If undefined, view does not have any manual layouts, and is auto-layouted
     */
    readonly [_layout]?: LayoutType;
    readonly autoLayout: ViewAutoLayout;
    readonly nodes: ReadonlyArray<DiagramNode<A>>;
    readonly edges: ReadonlyArray<DiagramEdge<A>>;
    readonly bounds: BBox;
    /**
     * If diagram has manual layout
     * But was changed and layout should be recalculated
     * @deprecated manual layout v2 uses {@link drifts}
     */
    readonly hasLayoutDrift?: boolean;
    /**
     * List of reasons causing layout drift
     * If undefined or null, there is no layout drift or view is auto-layouted
     */
    readonly drifts?: NonEmptyReadonlyArray<LayoutedViewDriftReason> | null;
}
export interface LayoutedElementView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
    readonly [_type]: 'element';
    readonly viewOf?: aux.Fqn<A>;
    readonly extends?: aux.StrictViewId<A>;
}
export interface LayoutedDeploymentView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
    readonly [_type]: 'deployment';
}
export interface LayoutedDynamicView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
    readonly [_type]: 'dynamic';
    /**
     * Default variant of this dynamic view
     * - `diagram`: display as a regular likec4 view (default if not specified)
     * - `sequence`: display as a sequence diagram
     */
    readonly variant: DynamicViewDisplayVariant;
    /**
     * Sequence layout of this dynamic view
     */
    readonly sequenceLayout: LayoutedDynamicView.Sequence.Layout;
}
export declare namespace LayoutedDynamicView {
    namespace Sequence {
        interface ActorPort {
            readonly id: string;
            readonly cx: number;
            readonly cy: number;
            readonly height: number;
            readonly type: 'target' | 'source';
            readonly position: 'left' | 'right' | 'top' | 'bottom';
        }
        interface Actor {
            readonly id: aux.NodeId;
            readonly x: number;
            readonly y: number;
            readonly width: number;
            readonly height: number;
            readonly ports: ReadonlyArray<ActorPort>;
        }
        interface Compound {
            readonly id: aux.NodeId;
            /**
             * Original node id, since multiple compound nodes can be built from one node
             */
            readonly origin: aux.NodeId;
            readonly x: number;
            readonly y: number;
            readonly width: number;
            readonly height: number;
            readonly depth: number;
        }
        interface ParallelArea {
            readonly parallelPrefix: string;
            readonly x: number;
            readonly y: number;
            readonly width: number;
            readonly height: number;
        }
        interface Step {
            readonly id: aux.EdgeId;
            readonly labelBBox?: {
                width: number;
                height: number;
            } | undefined;
            readonly sourceHandle: string;
            readonly targetHandle: string;
        }
        interface Layout {
            readonly actors: ReadonlyArray<Actor>;
            /**
             * Steps in the sequence diagram (filtered edges with compound nodes)
             */
            readonly steps: ReadonlyArray<Step>;
            readonly compounds: ReadonlyArray<Compound>;
            readonly parallelAreas: ReadonlyArray<ParallelArea>;
            readonly bounds: BBox;
        }
    }
}
export {};
