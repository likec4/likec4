import type { BBox, Fqn, ViewId } from '@likec4/core';
import { type EdgeChange, type NodeChange, type ReactFlowInstance, type ReactFlowState } from '@xyflow/react';
import { type ActorRef, type SnapshotFrom, type StateMachine } from 'xstate';
import type { RelationshipsBrowserTypes } from './_types';
import type { LayoutRelationshipsViewResult } from './layout';
type XYFLowInstance = ReactFlowInstance<RelationshipsBrowserTypes.AnyNode, RelationshipsBrowserTypes.Edge>;
type XYStoreState = ReactFlowState<RelationshipsBrowserTypes.AnyNode, RelationshipsBrowserTypes.Edge>;
type XYStoreApi = {
    getState: () => XYStoreState;
    setState: (state: XYStoreState) => void;
};
export declare const layouter: import("xstate").PromiseActorLogic<{
    xyedges: RelationshipsBrowserTypes.Edge[];
    xynodes: RelationshipsBrowserTypes.Node[];
}, {
    subjectId: Fqn;
    navigateFromNode: string | null;
    xyflow: XYFLowInstance;
    xystore: XYStoreApi;
    update: LayoutRelationshipsViewResult;
}, import("xstate").EventObject>;
export type Input = {
    subject: Fqn;
    viewId: ViewId | null;
    scope: 'global' | 'view';
    closeable?: boolean;
    enableSelectSubject?: boolean;
    enableChangeScope?: boolean;
};
export interface Context {
    subject: Fqn;
    viewId: ViewId | null;
    scope: 'global' | 'view';
    closeable: boolean;
    enableSelectSubject: boolean;
    enableChangeScope: boolean;
    xyflow: XYFLowInstance | null;
    xystore: XYStoreApi | null;
    layouted: LayoutRelationshipsViewResult | null;
    navigateFromNode: string | null;
    xynodes: RelationshipsBrowserTypes.Node[];
    xyedges: RelationshipsBrowserTypes.Edge[];
}
export type Events = {
    type: 'xyflow.init';
    instance: XYFLowInstance;
    store: XYStoreApi;
} | {
    type: 'xyflow.nodeClick';
    node: RelationshipsBrowserTypes.Node;
} | {
    type: 'xyflow.edgeClick';
    edge: RelationshipsBrowserTypes.Edge;
} | {
    type: 'xyflow.applyNodeChanges';
    changes: NodeChange<RelationshipsBrowserTypes.Node>[];
} | {
    type: 'xyflow.applyEdgeChanges';
    changes: EdgeChange<RelationshipsBrowserTypes.Edge>[];
} | {
    type: 'xyflow.paneClick';
} | {
    type: 'xyflow.paneDblClick';
} | {
    type: 'xyflow.resized';
} | {
    type: 'xyflow.edgeMouseEnter';
    edge: RelationshipsBrowserTypes.Edge;
} | {
    type: 'xyflow.edgeMouseLeave';
    edge: RelationshipsBrowserTypes.Edge;
} | {
    type: 'xyflow.selectionChange';
    nodes: RelationshipsBrowserTypes.Node[];
    edges: RelationshipsBrowserTypes.Edge[];
} | {
    type: 'dim.nonhovered.edges';
} | {
    type: 'undim.edges';
} | {
    type: 'xyflow.updateNodeInternals';
} | {
    type: 'xyflow.unmount';
} | {
    type: 'fitDiagram';
    duration?: number;
    bounds?: BBox;
} | {
    type: 'navigate.to';
    subject: Fqn;
    fromNode?: string | undefined;
    viewId?: ViewId | undefined;
} | {
    type: 'update.xydata';
    xynodes: RelationshipsBrowserTypes.Node[];
    xyedges: RelationshipsBrowserTypes.Edge[];
} | {
    type: 'change.scope';
    scope: 'global' | 'view';
} | {
    type: 'update.view';
    layouted: LayoutRelationshipsViewResult;
} | {
    type: 'close';
};
type Tags = 'active';
export interface RelationshipsBrowserLogic extends StateMachine<Context, Events, {}, any, any, any, any, any, Tags, Input, any, any, any, any> {
}
export declare const relationshipsBrowserLogic: RelationshipsBrowserLogic;
export type RelationshipsBrowserSnapshot = SnapshotFrom<RelationshipsBrowserLogic>;
export interface RelationshipsBrowserActorRef extends ActorRef<RelationshipsBrowserSnapshot, Events> {
}
export type { Input as RelationshipsBrowserInput, };
