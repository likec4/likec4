export declare const ready: {
    initial: string;
    entry: import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
    exit: import("xstate/actions").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
    states: {
        idle: {
            id: string;
            on: {
                'xyflow.nodeClick': ({
                    target: string;
                    guard: import("xstate/guards").GuardPredicate<import("./machine.setup").Context, {
                        type: "xyflow.nodeClick";
                        node: import("../types").Types.Node;
                    }, unknown, {
                        type: "enabled: Readonly";
                        params: undefined;
                    } | {
                        type: "enabled: FocusMode";
                        params: undefined;
                    } | {
                        type: "click: node has connections";
                        params: undefined;
                    }>;
                    actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
                    }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
                } | {
                    guard: import("xstate/guards").GuardPredicate<import("./machine.setup").Context, {
                        type: "xyflow.nodeClick";
                        node: import("../types").Types.Node;
                    }, unknown, {
                        type: "enabled: ElementDetails";
                        params: undefined;
                    } | {
                        type: "click: node has modelFqn";
                        params: undefined;
                    } | {
                        type: "enabled: Readonly";
                        params: undefined;
                    }>;
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
                } | {
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
                    guard?: undefined;
                })[];
                'xyflow.paneClick': {
                    actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
                    }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
                };
                'xyflow.paneDblClick': {
                    actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
                    }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
                };
                'focus.node': ({
                    guard: "focus.node: autoUnfocus";
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
                    }>, never, never, never, never>;
                    target: string;
                } | {
                    guard: "enabled: FocusMode";
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
                    }>, never, never, never, never>;
                    target: string;
                })[];
                'xyflow.edgeClick': {
                    guard: import("xstate/guards").GuardPredicate<import("./machine.setup").Context, {
                        type: "xyflow.edgeClick";
                        edge: import("../types").Types.Edge;
                    }, unknown, {
                        type: "enabled: Readonly";
                        params: undefined;
                    } | {
                        type: "is dynamic view";
                        params: undefined;
                    } | {
                        type: "enabled: DynamicViewWalkthrough";
                        params: undefined;
                    } | {
                        type: "click: selected edge";
                        params: undefined;
                    }>;
                    actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
                    }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
                };
            };
        };
        focused: {
            id: string;
            entry: import("xstate/actions").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
            exit: import("xstate/actions").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
            on: {
                'focus.autoUnfocus': {
                    target: string;
                };
                'xyflow.nodeClick': ({
                    guard: import("xstate/guards").GuardPredicate<import("./machine.setup").Context, {
                        type: "xyflow.nodeClick";
                        node: import("../types").Types.Node;
                    }, unknown, {
                        type: "enabled: ElementDetails";
                        params: undefined;
                    } | {
                        type: "click: focused node";
                        params: undefined;
                    } | {
                        type: "click: node has modelFqn";
                        params: undefined;
                    }>;
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
                } | {
                    target: string;
                    guard: "click: focused node";
                    actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
                    }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
                } | {
                    actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
                    }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
                    guard?: undefined;
                })[];
                'focus.node': {
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
                };
                'key.esc': {
                    target: string;
                };
                'xyflow.paneClick': {
                    target: string;
                    actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>[];
                };
                'notations.unhighlight': {
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
                    }>, never, import("./machine.setup").EmittedEvents>;
                };
                'tag.unhighlight': {
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
                    }>, never, import("./machine.setup").EmittedEvents>;
                };
            };
        };
        walkthrough: {
            id: string;
            entry: import("xstate/actions").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
            exit: import("xstate/actions").StopAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
            on: {
                'key.esc': {
                    target: string;
                };
                'key.arrow.left': {
                    actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./hotkeyActor").HotKeyEvent, import("./machine.setup").Events, undefined, never, never, never, never, never>;
                };
                'key.arrow.up': {
                    actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./hotkeyActor").HotKeyEvent, import("./machine.setup").Events, undefined, never, never, never, never, never>;
                };
                'key.arrow.right': {
                    actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./hotkeyActor").HotKeyEvent, import("./machine.setup").Events, undefined, never, never, never, never, never>;
                };
                'key.arrow.down': {
                    actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./hotkeyActor").HotKeyEvent, import("./machine.setup").Events, undefined, never, never, never, never, never>;
                };
                'walkthrough.step': {
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
                };
                'xyflow.edgeClick': ({
                    guard: "click: active walkthrough step";
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
                } | {
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
                    guard?: undefined;
                })[];
                'notations.unhighlight': {
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
                    }>, never, import("./machine.setup").EmittedEvents>;
                };
                'tag.unhighlight': {
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
                    }>, never, import("./machine.setup").EmittedEvents>;
                };
                'update.view': {
                    guard: "is same view";
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
                };
                'walkthrough.end': {
                    target: string;
                };
                'xyflow.paneDblClick': {
                    target: string;
                };
            };
        };
        printing: {
            id: string;
            entry: import("xstate/actions").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
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
                    actions: import("xstate/actions").LogAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
                };
            };
        };
    };
    on: {
        'layout.align': {
            guard: "not readonly";
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
        };
        'layout.resetEdgeControlPoints': {
            guard: "not readonly";
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
        };
        'layout.resetManualLayout': {
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
        };
        'media.print.on': {
            target: string;
        };
        'navigate.*': {
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
            }>, never, import("./machine.setup").EmittedEvents>;
        };
        'notations.highlight': {
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
            }>, never, never, never, never>;
        };
        'notations.unhighlight': {
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
            }>, never, never, never, never>;
        };
        'highlight.*': {
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
            }>, never, never, never, never>;
        };
        'unhighlight.all': {
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
            }>, never, never, never, never>;
        };
        'open.elementDetails': {
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
            }>, never, import("./machine.setup").EmittedEvents>;
        };
        'open.relationshipDetails': {
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
            }>, never, import("./machine.setup").EmittedEvents>;
        };
        'open.relationshipsBrowser': {
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
            }>, never, import("./machine.setup").EmittedEvents>;
        };
        'open.search': {
            guard: "enabled: Search";
            actions: import("xstate").ActionFunction<import("./machine.setup").Context, {
                type: "open.search";
                search?: string;
            }, import("./machine.setup").Events, undefined, never, never, never, never, never>;
        };
        'open.source': {
            guard: "enabled: OpenSource";
            actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>;
        };
        'tag.highlight': {
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
            }>, never, never, never, never>;
        };
        'tag.unhighlight': {
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
            }>, never, never, never, never>;
        };
        'toggle.feature': {
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
            }>, never, never, never, never>;
        };
        'update.features': {
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
        };
        'update.view': ({
            target: string;
            guard: "is another view";
            actions?: undefined;
        } | {
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
            }>, never, import("./machine.setup").EmittedEvents>;
        })[];
        'walkthrough.start': {
            target: string;
            guard: "is dynamic view";
        };
        'xyflow.edgeClick': {
            actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
            }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
        };
        'xyflow.edgeDoubleClick': {
            guard: import("xstate/guards").GuardPredicate<import("./machine.setup").Context, {
                type: "xyflow.edgeDoubleClick";
                edge: import("../types").Types.Edge;
            }, unknown, {
                type: "not readonly";
                params: undefined;
            }>;
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
        };
        'xyflow.edgeMouseEnter': {
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
            }>, never, import("./machine.setup").EmittedEvents>;
        };
        'xyflow.edgeMouseLeave': {
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
            }>, never, import("./machine.setup").EmittedEvents>;
        };
        'xyflow.centerViewport': {
            actions: import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, never>;
        };
        'xyflow.fitDiagram': {
            guard: "enabled: FitView";
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
        };
        'xyflow.nodeClick': {
            actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
            }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
        };
        'xyflow.nodeMouseEnter': {
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
            }>, never, never, never, never>;
        };
        'xyflow.nodeMouseLeave': {
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
            }>, never, never, never, never>;
        };
        'xyflow.paneClick': {
            actions: (import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
            }>, never, never, never, never> | import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>)[];
        };
        'xyflow.paneDblClick': {
            actions: import("xstate/actions").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
        };
        'xyflow.resized': {
            guard: ({ context }: import("xstate/guards").GuardArgs<import("./machine.setup").Context, {
                type: "xyflow.resized";
            }>) => boolean;
            actions: import("xstate/actions").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
        };
        'xyflow.setViewport': {
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
            }>, never, import("./machine.setup").EmittedEvents>;
        };
    };
};
