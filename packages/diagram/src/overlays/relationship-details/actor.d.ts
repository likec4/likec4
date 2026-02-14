import { type BBox, type EdgeId, type ExclusiveUnion, type Fqn, type ViewId } from '@likec4/core';
import { type EdgeChange, type NodeChange, type ReactFlowInstance, type ReactFlowState } from '@xyflow/react';
import { type ActorRef, type SnapshotFrom, type StateMachine } from 'xstate';
import type { RelationshipDetailsTypes } from './_types';
import type { LayoutResult } from './layout';
type XYFLowInstance = ReactFlowInstance<RelationshipDetailsTypes.AnyNode, RelationshipDetailsTypes.Edge>;
type XYStoreState = ReactFlowState<RelationshipDetailsTypes.AnyNode, RelationshipDetailsTypes.Edge>;
type XYStoreApi = {
    getState: () => XYStoreState;
};
export type Input = ExclusiveUnion<{
    Edge: {
        edgeId: EdgeId;
        viewId: ViewId;
    };
    Between: {
        source: Fqn;
        target: Fqn;
        viewId: ViewId;
    };
}>;
type Subject = {
    edgeId: EdgeId;
    source?: never;
    target?: never;
} | {
    source: Fqn;
    target: Fqn;
    edgeId?: never;
};
export type Context = Readonly<{
    subject: Subject;
    viewId: ViewId;
    xyflow: XYFLowInstance | null;
    xystore: XYStoreApi | null;
    initialized: {
        xydata: boolean;
        xyflow: boolean;
    };
    xynodes: RelationshipDetailsTypes.Node[];
    xyedges: RelationshipDetailsTypes.Edge[];
    bounds: BBox;
}>;
export type Events = {
    type: 'xyflow.init';
    instance: XYFLowInstance;
    store: XYStoreApi;
} | {
    type: 'xyflow.nodeClick';
    node: RelationshipDetailsTypes.Node;
} | {
    type: 'xyflow.edgeClick';
    edge: RelationshipDetailsTypes.Edge;
} | {
    type: 'xyflow.edgeMouseEnter';
    edge: RelationshipDetailsTypes.Edge;
} | {
    type: 'xyflow.edgeMouseLeave';
    edge: RelationshipDetailsTypes.Edge;
} | {
    type: 'dim.nonhovered.edges';
} | {
    type: 'undim.edges';
} | {
    type: 'xyflow.selectionChange';
    nodes: RelationshipDetailsTypes.Node[];
    edges: RelationshipDetailsTypes.Edge[];
} | {
    type: 'xyflow.applyNodeChanges';
    changes: NodeChange<RelationshipDetailsTypes.Node>[];
} | {
    type: 'xyflow.applyEdgeChanges';
    changes: EdgeChange<RelationshipDetailsTypes.Edge>[];
} | {
    type: 'xyflow.paneClick';
} | {
    type: 'xyflow.paneDblClick';
} | {
    type: 'xyflow.resized';
} | {
    type: 'xyflow.updateNodeInternals';
} | {
    type: 'update.layoutData';
    data: LayoutResult;
} | {
    type: 'fitDiagram';
    duration?: number;
    bounds?: BBox;
} | {
    type: 'navigate.to';
    params: {
        edgeId: EdgeId;
        viewId?: ViewId;
    } | {
        source: Fqn;
        target: Fqn;
        viewId?: ViewId;
    };
} | {
    type: 'close';
};
export type Tags = never;
export interface RelationshipDetailsLogic extends StateMachine<Context, Events, {}, any, any, any, any, any, Tags, Input, any, any, any, any> {
}
export declare const relationshipDetailsLogic: RelationshipDetailsLogic;
export type RelationshipDetailsSnapshot = SnapshotFrom<RelationshipDetailsLogic>;
export interface RelationshipDetailsActorRef extends ActorRef<RelationshipDetailsSnapshot, Events> {
}
export type { Input as RelationshipDetailsInput, };
