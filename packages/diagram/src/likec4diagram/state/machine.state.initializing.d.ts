/**
 * To be in `initializing` state, the diagram must wait for two events:
 * - `xyflow.init` - indicates that the `xyflow` instance is ready
 * - `update.view` - provides the initial diagram data (nodes and edges)
 *
 * Once both events have been received, the diagram transitions to `isReady` state.
 */
export declare const initializing: {
    on: {
        'xyflow.init': {
            actions: import("xstate").ActionFunction<import("./machine.setup").Context, {
                type: "xyflow.init";
                instance: import("../../hooks").XYFlowInstance;
            }, import("./machine.setup").Events, undefined, import("xstate").Values<{
                hotkeyActorLogic: {
                    src: "hotkeyActorLogic";
                    logic: import("./hotkeyActor").HotkeyActorLogic;
                    id: "hotkey";
                };
                overlaysActorLogic: {
                    src: "overlaysActorLogic";
                    logic: import("../../overlays/overlaysActor").OverlaysActorLogic;
                    id: "overlays";
                };
                searchActorLogic: {
                    src: "searchActorLogic";
                    logic: import("../../search/searchActor").SearchActorLogic;
                    id: "search";
                };
                mediaPrintActorLogic: {
                    src: "mediaPrintActorLogic";
                    logic: import("./mediaPrintActor").MediaPrintActorLogic;
                    id: "mediaPrint";
                };
                editorActor: {
                    src: "editorActor";
                    logic: import("../../editor").EditorActorLogic;
                    id: "editor";
                };
            }>, never, never, never, never>;
            target: string;
        };
        'update.view': {
            actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
                hotkeyActorLogic: {
                    src: "hotkeyActorLogic";
                    logic: import("./hotkeyActor").HotkeyActorLogic;
                    id: "hotkey";
                };
                overlaysActorLogic: {
                    src: "overlaysActorLogic";
                    logic: import("../../overlays/overlaysActor").OverlaysActorLogic;
                    id: "overlays";
                };
                searchActorLogic: {
                    src: "searchActorLogic";
                    logic: import("../../search/searchActor").SearchActorLogic;
                    id: "search";
                };
                mediaPrintActorLogic: {
                    src: "mediaPrintActorLogic";
                    logic: import("./mediaPrintActor").MediaPrintActorLogic;
                    id: "mediaPrint";
                };
                editorActor: {
                    src: "editorActor";
                    logic: import("../../editor").EditorActorLogic;
                    id: "editor";
                };
            }>, never, never, never, never>[];
            target: string;
        };
    };
};
/**
 * State that checks whether the diagram is ready to be used.
 * Transitions to `ready` state if both `xyflow` and `xydata` are initialized,
 * otherwise goes back to `initializing` state.`
 */
export declare const isReady: {
    always: ({
        guard: "isReady";
        actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, unknown, import("xstate").Values<{
            hotkeyActorLogic: {
                src: "hotkeyActorLogic";
                logic: import("./hotkeyActor").HotkeyActorLogic;
                id: "hotkey";
            };
            overlaysActorLogic: {
                src: "overlaysActorLogic";
                logic: import("../../overlays/overlaysActor").OverlaysActorLogic;
                id: "overlays";
            };
            searchActorLogic: {
                src: "searchActorLogic";
                logic: import("../../search/searchActor").SearchActorLogic;
                id: "search";
            };
            mediaPrintActorLogic: {
                src: "mediaPrintActorLogic";
                logic: import("./mediaPrintActor").MediaPrintActorLogic;
                id: "mediaPrint";
            };
            editorActor: {
                src: "editorActor";
                logic: import("../../editor").EditorActorLogic;
                id: "editor";
            };
        }>, never, import("xstate").Values<{
            isReady: {
                type: "isReady";
                params: unknown;
            };
            "enabled: Editor": {
                type: "enabled: Editor";
                params: unknown;
            };
            "enabled: FitView": {
                type: "enabled: FitView";
                params: unknown;
            };
            "enabled: FocusMode": {
                type: "enabled: FocusMode";
                params: unknown;
            };
            "enabled: Readonly": {
                type: "enabled: Readonly";
                params: unknown;
            };
            "enabled: RelationshipDetails": {
                type: "enabled: RelationshipDetails";
                params: unknown;
            };
            "enabled: Search": {
                type: "enabled: Search";
                params: unknown;
            };
            "enabled: ElementDetails": {
                type: "enabled: ElementDetails";
                params: unknown;
            };
            "enabled: OpenSource": {
                type: "enabled: OpenSource";
                params: unknown;
            };
            "enabled: DynamicViewWalkthrough": {
                type: "enabled: DynamicViewWalkthrough";
                params: unknown;
            };
            "focus.node: autoUnfocus": {
                type: "focus.node: autoUnfocus";
                params: unknown;
            };
            "enabled: Overlays": {
                type: "enabled: Overlays";
                params: unknown;
            };
            "not readonly": {
                type: "not readonly";
                params: unknown;
            };
            "is dynamic view": {
                type: "is dynamic view";
                params: unknown;
            };
            "is same view": {
                type: "is same view";
                params: unknown;
            };
            "is another view": {
                type: "is another view";
                params: unknown;
            };
            "click: node has modelFqn": {
                type: "click: node has modelFqn";
                params: unknown;
            };
            "click: selected node": {
                type: "click: selected node";
                params: unknown;
            };
            "click: same node": {
                type: "click: same node";
                params: unknown;
            };
            "click: focused node": {
                type: "click: focused node";
                params: unknown;
            };
            "click: node has connections": {
                type: "click: node has connections";
                params: unknown;
            };
            "click: selected edge": {
                type: "click: selected edge";
                params: unknown;
            };
            "click: active walkthrough step": {
                type: "click: active walkthrough step";
                params: unknown;
            };
        }>, never, import("./machine.setup").EmittedEvents>[];
        target: string;
    } | {
        target: string;
        guard?: undefined;
        actions?: undefined;
    })[];
};
