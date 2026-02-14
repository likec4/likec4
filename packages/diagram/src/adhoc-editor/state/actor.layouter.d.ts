import type { ViewId } from '@likec4/core';
export declare const emitViewUpdate: () => import("xstate").ActionFunction<import("./actor.types").Context, import("./actor.types").Events, import("./actor.types").Events, undefined, never, never, never, never, import("./actor.types").EmittedEvents>;
export declare const layouter: {
    initial: string;
    states: {
        idle: {
            id: string;
            entry: import("xstate").LogAction<import("./actor.types").Context, import("./actor.types").Events, undefined, import("./actor.types").Events>;
            exit: import("xstate").LogAction<import("./actor.types").Context, import("./actor.types").Events, undefined, import("./actor.types").Events>;
            on: {
                layout: {
                    target: "#layouter-call";
                };
            };
        };
        call: {
            id: string;
            entry: import("xstate").LogAction<import("./actor.types").Context, import("./actor.types").Events, undefined, import("./actor.types").Events>;
            exit: import("xstate").LogAction<import("./actor.types").Context, import("./actor.types").Events, undefined, import("./actor.types").Events>;
            invoke: {
                src: "service";
                input: ({ context }: {
                    context: import("./actor.types").Context;
                    event: import("./actor.types").Events;
                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<import("./actor.types").Context, import("./actor.types").Events, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, import("./actor.types").Events, import("xstate").AnyEventObject>;
                }) => {
                    predicates: any;
                };
                onDone: {
                    target: "#layouter-idle";
                    actions: (import("xstate").ActionFunction<import("./actor.types").Context, import("xstate").DoneActorEvent<{
                        view: ViewId;
                    }, string>, import("./actor.types").Events, undefined, {
                        src: "service";
                        logic: import("./actor.types").AdhocViewServiceActor;
                        id: string;
                    }, never, never, never, never> | import("xstate").ActionFunction<import("./actor.types").Context, import("xstate").DoneActorEvent<{
                        view: ViewId;
                    }, string>, import("./actor.types").Events, undefined, never, never, never, never, import("./actor.types").EmittedEvents>)[];
                };
                onError: {
                    target: "#layouter-idle";
                    actions: import("xstate").LogAction<import("./actor.types").Context, import("xstate").ErrorActorEvent<unknown, string>, undefined, import("./actor.types").Events>[];
                };
            };
        };
    };
};
