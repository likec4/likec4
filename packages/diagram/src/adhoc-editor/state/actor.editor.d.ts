import type { Context } from './actor.types';
export declare const editor: {
    initial: string;
    states: {
        idle: {
            id: string;
            on: {
                'select.open': {
                    target: "#selecting";
                };
                'toggle.rule': {
                    target: "#layouting";
                    actions: import("xstate").ActionFunction<Context, import("./actor.types").Events, import("./actor.types").Events, undefined, {
                        src: "service";
                        logic: import("./actor.types").AdhocViewServiceActor;
                        id: string;
                    }, never, never, never, never>;
                };
                'delete.rule': {
                    target: "#layouting";
                    actions: import("xstate").ActionFunction<Context, import("./actor.types").Events, import("./actor.types").Events, undefined, {
                        src: "service";
                        logic: import("./actor.types").AdhocViewServiceActor;
                        id: string;
                    }, never, never, never, never>;
                };
            };
        };
        selecting: {
            id: string;
            on: {
                'toggle.element': {
                    actions: import("xstate").ActionFunction<Context, import("./actor.types").Events, import("./actor.types").Events, undefined, {
                        src: "service";
                        logic: import("./actor.types").AdhocViewServiceActor;
                        id: string;
                    }, never, {
                        type: "hasView";
                        params: unknown;
                    }, never, import("./actor.types").EmittedEvents>[];
                };
                'select.close': {
                    target: "#idle";
                };
            };
        };
        layouting: {
            id: string;
            always: {
                target: "#idle";
                actions: import("xstate").ActionFunction<Context, import("./actor.types").Events, import("./actor.types").Events, undefined, never, never, never, never, never>;
            };
        };
    };
};
