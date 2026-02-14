import type { DiagramView, Fqn, NodeId } from '@likec4/core/types';
import type { Rect } from '@xyflow/system';
import { type ActorRef, type SnapshotFrom, type StateMachine } from 'xstate';
import { type RelationshipsBrowserActorRef } from '../relationships-browser/actor';
export type Input = {
    subject: Fqn;
    currentView: DiagramView;
    initiatedFrom?: {
        node?: NodeId;
        clientRect?: Rect;
    };
};
export type Context = {
    subject: Fqn;
    currentView: DiagramView;
    initiatedFrom: {
        node: NodeId | null;
        clientRect: Rect | null;
    };
};
export type Events = {
    type: 'change.subject';
    subject: Fqn;
} | {
    type: 'close';
};
export interface ElementDetailsLogic extends StateMachine<Context, Events, {
    [key: `${string}-relationships`]: RelationshipsBrowserActorRef | undefined;
}, any, any, any, any, any, never, Input, any, any, any, any> {
}
export declare const elementDetailsLogic: ElementDetailsLogic;
export type ElementDetailsSnapshot = SnapshotFrom<ElementDetailsLogic>;
export interface ElementDetailsActorRef extends ActorRef<ElementDetailsSnapshot, Events> {
}
export type { Input as ElementDetailsInput, };
