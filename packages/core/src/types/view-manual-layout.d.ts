import type { Simplify } from 'type-fest';
import type { BBox } from '../geometry';
import type { _stage, _type } from './const';
import type * as scalar from './scalar';
import type { ViewAutoLayout, ViewType, ViewWithNotation } from './view-common';
import type { DiagramEdge, DiagramNode, LayoutedDynamicView } from './view-layouted';
export type LayoutedViewDriftReason = 'not-exists' | 'type-changed' | 'nodes-added' | 'nodes-removed' | 'nodes-drift' | 'edges-added' | 'edges-removed' | 'edges-drift';
export type DiagramNodeDriftReason = 'removed' | 'added' | 'label-changed' | 'modelRef-changed' | 'parent-changed' | 'children-changed' | 'became-compound' | 'became-leaf' | 'shape-changed';
export type DiagramEdgeDriftReason = 'removed' | 'added' | 'label-added' | 'label-removed' | 'label-changed' | 'notes-changed' | 'direction-changed' | 'source-changed' | 'target-changed';
type ViewManualLayoutSnapshotPerType = {
    readonly [_type]: 'element';
    readonly viewOf?: scalar.Fqn;
    readonly extends?: scalar.ViewId;
} | {
    readonly [_type]: 'deployment';
} | {
    readonly [_type]: 'dynamic';
    readonly sequenceLayout: LayoutedDynamicView.Sequence.Layout;
};
export type ViewManualLayoutSnapshot<Type extends ViewType = ViewType> = Simplify<ViewManualLayoutSnapshotPerType & {
    readonly id: scalar.ViewId;
    readonly title: string | null;
    readonly description: scalar.MarkdownOrString | null;
    readonly [_type]: Type;
    readonly [_stage]: 'layouted';
    readonly hash: string;
    readonly nodes: ReadonlyArray<DiagramNode>;
    readonly edges: ReadonlyArray<DiagramEdge>;
    readonly bounds: BBox;
    readonly autoLayout: ViewAutoLayout;
} & ViewWithNotation>;
export {};
