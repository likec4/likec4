import type { Fqn } from '@likec4/core/types';
import { type ActorRef, type SnapshotFrom, type StateMachine } from 'xstate';
import type { Overlays } from './types';
export type OverlayActorEvent = {
    type: 'open.elementDetails';
} & Overlays.ElementDetails.Input | {
    type: 'open.relationshipDetails';
} & Overlays.RelationshipDetails.Input | {
    type: 'open.relationshipsBrowser';
} & Overlays.RelationshipsBrowser.Input | {
    type: 'close';
    actorId?: string | undefined;
} | {
    type: 'close.all';
};
export interface OverlaysContext {
    seq: number;
    overlays: Array<{
        type: 'elementDetails';
        id: `elementDetails-${number}`;
        subject: Fqn;
    } | {
        type: 'relationshipDetails';
        id: `relationshipDetails-${number}`;
    } | {
        type: 'relationshipsBrowser';
        id: `relationshipsBrowser-${number}`;
        subject: Fqn;
    }>;
}
export type OverlayActorEmitedEvent = {
    type: 'opened';
    overlay: 'elementDetails' | 'relationshipsBrowser' | 'relationshipDetails';
} | {
    type: 'closed';
    overlay: 'elementDetails' | 'relationshipsBrowser' | 'relationshipDetails';
} | {
    type: 'idle';
};
export interface OverlaysActorLogic extends StateMachine<OverlaysContext, OverlayActorEvent, {
    [key: `elementDetails-${number}`]: Overlays.ElementDetails.ActorRef | undefined;
    [key: `relationshipDetails-${number}`]: Overlays.RelationshipDetails.ActorRef | undefined;
    [key: `relationshipsBrowser-${number}`]: Overlays.RelationshipsBrowser.ActorRef | undefined;
}, any, any, any, any, any, never, never, any, OverlayActorEmitedEvent, any, any> {
}
export declare const overlaysActorLogic: OverlaysActorLogic;
export type OverlaysActorSnapshot = SnapshotFrom<OverlaysActorLogic>;
export interface OverlaysActorRef extends ActorRef<OverlaysActorSnapshot, OverlayActorEvent, OverlayActorEmitedEvent> {
}
