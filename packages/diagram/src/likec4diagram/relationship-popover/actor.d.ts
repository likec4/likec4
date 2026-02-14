import type { EdgeId } from '@likec4/core/types';
import { type ActorLogicFrom, type ActorRefFrom, type SnapshotFrom } from 'xstate';
export type RelationshipPopoverActorEvent = {
    type: 'xyedge.mouseEnter';
    edgeId: EdgeId;
} | {
    type: 'xyedge.mouseLeave';
} | {
    type: 'xyedge.select';
    edgeId: EdgeId;
} | {
    type: 'xyedge.unselect';
} | {
    type: 'close';
} | {
    type: 'dropdown.mouseEnter';
} | {
    type: 'dropdown.mouseLeave';
};
export interface RelationshipPopoverActorContext {
    edgeId: EdgeId | null;
    /**
     * True if the edge was selected
     */
    edgeSelected: boolean;
    /**
     * The timeout for opening the popover
     * If it was closed recently (<1.5s), it will be 300ms
     * Otherwise, it will be 800ms
     */
    openTimeout: number;
}
declare const _actorLogic: import("xstate").StateMachine<RelationshipPopoverActorContext, RelationshipPopoverActorEvent, {}, never, import("xstate").Values<{
    "update edgeId": {
        type: "update edgeId";
        params: {};
    };
    "increase open timeout": {
        type: "increase open timeout";
        params: {};
    };
    "decrease open timeout": {
        type: "decrease open timeout";
        params: {};
    };
    "reset edgeId": {
        type: "reset edgeId";
        params: {};
    };
}>, import("xstate").Values<{
    "edge was selected": {
        type: "edge was selected";
        params: unknown;
    };
    "edge was hovered": {
        type: "edge was hovered";
        params: unknown;
    };
}>, "open timeout" | "close timeout" | "long idle", "idle" | "opening" | {
    active: "opened" | "hovered" | "closing";
}, "opened", {}, {}, import("xstate").EventObject, import("xstate").MetaObject, {
    readonly id: "breadcrumbs";
    readonly context: () => {
        edgeId: any;
        edgeSelected: false;
        openTimeout: number;
    };
    readonly initial: "idle";
    readonly on: {
        readonly close: {
            readonly target: "#idle";
            readonly actions: readonly ["reset edgeId", "increase open timeout"];
        };
    };
    readonly states: {
        readonly idle: {
            readonly id: "idle";
            readonly on: {
                readonly 'xyedge.mouseEnter': {
                    readonly target: "opening";
                    readonly actions: "update edgeId";
                };
                readonly 'xyedge.select': {
                    readonly target: "active";
                    readonly actions: "update edgeId";
                };
            };
            readonly after: {
                readonly 'long idle': {
                    readonly actions: "increase open timeout";
                };
            };
        };
        readonly opening: {
            readonly on: {
                readonly 'xyedge.mouseLeave': {
                    readonly target: "idle";
                };
                readonly 'xyedge.select': {
                    readonly target: "active";
                    readonly actions: "update edgeId";
                };
            };
            readonly after: {
                readonly 'open timeout': {
                    readonly actions: "decrease open timeout";
                    readonly target: "active";
                };
            };
        };
        readonly active: {
            readonly tags: readonly ["opened"];
            readonly initial: "opened";
            readonly exit: "reset edgeId";
            readonly on: {
                readonly 'xyedge.unselect': {
                    readonly target: "idle";
                    readonly actions: "increase open timeout";
                };
                readonly 'xyedge.select': {
                    readonly actions: "update edgeId";
                };
            };
            readonly states: {
                readonly opened: {
                    readonly on: {
                        readonly 'dropdown.mouseEnter': {
                            readonly target: "hovered";
                        };
                        readonly 'xyedge.mouseLeave': {
                            readonly guard: "edge was hovered";
                            readonly target: "closing";
                        };
                    };
                };
                readonly hovered: {
                    readonly on: {
                        readonly 'dropdown.mouseLeave': readonly [{
                            readonly guard: "edge was selected";
                            readonly target: "opened";
                        }, {
                            readonly target: "closing";
                        }];
                    };
                };
                readonly closing: {
                    readonly on: {
                        readonly 'xyedge.mouseEnter': {
                            readonly guard: "edge was hovered";
                            readonly target: "opened";
                            readonly actions: "update edgeId";
                        };
                        readonly 'xyedge.select': {
                            readonly target: "opened";
                            readonly actions: "update edgeId";
                        };
                        readonly 'dropdown.mouseEnter': {
                            readonly target: "hovered";
                        };
                    };
                    readonly after: {
                        readonly 'close timeout': {
                            readonly target: "#idle";
                        };
                    };
                };
            };
        };
    };
}>;
export interface RelationshipPopoverActorLogic extends ActorLogicFrom<typeof _actorLogic> {
}
export declare const RelationshipPopoverActorLogic: RelationshipPopoverActorLogic;
export type RelationshipPopoverActorSnapshot = SnapshotFrom<RelationshipPopoverActorLogic>;
export interface RelationshipPopoverActorRef extends ActorRefFrom<RelationshipPopoverActorLogic> {
}
export {};
