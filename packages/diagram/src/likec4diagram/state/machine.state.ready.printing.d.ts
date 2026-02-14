/**
 * State when the diagram is being prepared for printing.
 * Adjusts the viewport to fit the entire diagram for optimal printing.
 * Restores the previous viewport upon exiting the state.
 */
export declare const printing: {
    id: string;
    entry: import("xstate").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
    exit: import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
    on: {
        'media.print.off': {
            target: string;
        };
        '*': {
            actions: import("xstate").LogAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
        };
    };
};
