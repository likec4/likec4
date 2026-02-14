import { type NodeId, type ProjectId, BBox } from '@likec4/core';
import type { LayoutedProjectsView } from '@likec4/core/compute-view';
import type { EdgeChange, NodeChange } from '@xyflow/system';
import type { MouseEvent } from 'react';
import type { Simplify } from 'type-fest';
import { type ActorRef, type SnapshotFrom, type StateMachine } from 'xstate';
import type { ViewPadding } from '../LikeC4Diagram.props';
import type { ProjectsOverviewTypes, ProjectsOverviewXYFLowInstance, ProjectsOverviewXYStoreApi } from './_types';
export type Input = {
    view: LayoutedProjectsView;
    fitViewPadding: ViewPadding;
};
export interface Context {
    initialized: {
        xydata: boolean;
        xyflow: boolean;
    };
    xystore: ProjectsOverviewXYStoreApi | null;
    xyflow: ProjectsOverviewXYFLowInstance | null;
    view: LayoutedProjectsView;
    fitViewPadding: ViewPadding;
    xynodes: ProjectsOverviewTypes.Node[];
    xyedges: ProjectsOverviewTypes.Edge[];
    navigateTo?: ProjectsOverviewTypes.Node;
}
export type EmittedEvents = {
    type: 'navigate.to';
    projectId: ProjectId;
};
/**
 * Converts a union of events to a union of events with a prefix.
 */
type EmitEach<T extends {
    type: string;
}> = {
    [Key in T['type']]: Simplify<{
        type: `emit.${Key}`;
    } & Omit<Extract<T, {
        type: Key;
    }>, 'type'>>;
}[T['type']];
export type Events = {
    type: 'navigate.to';
    projectId: ProjectId;
    fromNode: NodeId;
} | {
    type: 'xyflow.init';
    xyflow: ProjectsOverviewXYFLowInstance;
    xystore: ProjectsOverviewXYStoreApi;
} | {
    type: 'xyflow.click.node';
    node: ProjectsOverviewTypes.Node;
} | {
    type: 'xyflow.click.edge';
    edge: ProjectsOverviewTypes.Edge;
} | {
    type: 'xyflow.click.pane';
} | {
    type: 'xyflow.click.double';
} | {
    type: 'xyflow.mouse.enter.node';
    node: ProjectsOverviewTypes.Node;
} | {
    type: 'xyflow.mouse.leave.node';
    node: ProjectsOverviewTypes.Node;
} | {
    type: 'xyflow.mouse.enter.edge';
    edge: ProjectsOverviewTypes.Edge;
    event: MouseEvent;
} | {
    type: 'xyflow.mouse.leave.edge';
    edge: ProjectsOverviewTypes.Edge;
    event: MouseEvent;
} | {
    type: 'xyflow.applyNodeChanges';
    changes: NodeChange<ProjectsOverviewTypes.Node>[];
} | {
    type: 'xyflow.applyEdgeChanges';
    changes: EdgeChange<ProjectsOverviewTypes.Edge>[];
} | {
    type: 'xyflow.fitDiagram';
    bounds?: BBox;
    duration?: number;
} | {
    type: 'update.view';
    view: LayoutedProjectsView;
} | EmitEach<EmittedEvents> | {
    type: 'close';
};
type Tags = 'active';
export declare const onMouseEnterOrLeave: () => import("xstate").ActionFunction<Context, Events, Events, undefined, never, never, never, never, never>;
export declare const fitDiagram: (params?: {
    duration?: number;
    bounds?: BBox;
}) => import("xstate").ActionFunction<Context, Events, Events, undefined, never, never, import("xstate").Values<{
    isReady: {
        type: "isReady";
        params: unknown;
    };
    "click: selected node": {
        type: "click: selected node";
        params: unknown;
    };
}>, never, EmittedEvents>;
export declare const restoreViewport: () => import("xstate").ActionFunction<Context, Events, Events, undefined, never, never, import("xstate").Values<{
    isReady: {
        type: "isReady";
        params: unknown;
    };
    "click: selected node": {
        type: "click: selected node";
        params: unknown;
    };
}>, never, EmittedEvents>;
export interface ProjectsOverviewLogic extends StateMachine<Context, Events, {}, any, any, any, any, any, Tags, Input, any, EmittedEvents, any, any> {
}
export declare const projectOverviewLogic: ProjectsOverviewLogic;
export type ProjectsOverviewSnapshot = SnapshotFrom<ProjectsOverviewLogic>;
export interface ProjectsOverviewActorRef extends ActorRef<ProjectsOverviewSnapshot, Events, EmittedEvents> {
}
export type { Input as ProjectsOverviewInput, };
