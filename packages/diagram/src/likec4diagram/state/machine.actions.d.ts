import type { DiagramView, Fqn, NodeId, ViewChange, ViewId } from '@likec4/core/types';
import type { OpenSourceParams } from '../../LikeC4Diagram.props';
import type { Types } from '../types';
import { type AlignmentMode } from './aligners';
export * from './machine.actions.layout';
export declare const disableCompareWithLatest: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const onEdgeDoubleClick: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const assignLastClickedNode: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const assignFocusedNode: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const resetLastClickedNode: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const updateFeatures: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const updateInputs: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const assignXYDataFromView: (view?: DiagramView) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const focusOnNodesAndEdges: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const undimEverything: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const assignDynamicViewVariant: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const onNodeMouseEnter: (params?: {
    node: Types.Node;
}) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const onNodeMouseLeave: (params?: {
    node: Types.Node;
}) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const emitPaneClick: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>;
export declare const emitOpenSource: (params?: OpenSourceParams) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>;
export declare const emitOpenSourceOfView: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>;
export declare const emitInitialized: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>;
export declare const emitNodeClick: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>;
export declare const emitNavigateTo: (params?: {
    viewId: ViewId;
}) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>;
export declare const emitEdgeClick: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, import("./machine.setup").EmittedEvents>;
export declare const triggerChange: (viewChange?: ViewChange) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const emitOnLayoutTypeChange: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const layoutAlign: (params?: {
    mode: AlignmentMode;
}) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, unknown, import("xstate").Values<{
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
export declare const resetEdgesControlPoints: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const notationsHighlight: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const tagHighlight: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const highlightNodeOrEdge: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const assignToggledFeatures: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const closeSearch: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, never>;
export declare const closeAllOverlays: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, never>;
export declare const stopEditorActor: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
/**
 * Ensure that the sync layout actor is running or stopped based on the read-only state
 */
export declare const ensureEditorActor: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const startEditing: (subject?: "node" | "edge") => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, never>;
export declare const sendSynced: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, never>;
export declare const stopEditing: (wasChanged?: boolean) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, never>;
export declare const cancelEditing: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, never>;
export declare const openElementDetails: (params?: {
    fqn: Fqn;
    fromNode?: NodeId | undefined;
}) => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const openOverlay: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const openSourceOfFocusedOrLastClickedNode: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
/**
 * Ensure that the overlays actor is running or stopped based on the current feature flags
 */
export declare const ensureOverlaysActor: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
/**
 * Ensure that the search actor is running or stopped based on the current feature flags
 */
export declare const ensureSearchActor: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const onEdgeMouseEnter: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const onEdgeMouseLeave: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const reraise: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, never, never, never, never, never>;
export declare const startHotKeyActor: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const stopHotKeyActor: () => import("xstate").StopAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>;
export declare const startAutoUnfocusTimer: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const cancelAutoUnfocusTimer: () => import("xstate").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>;
export declare const handleNavigate: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
export declare const updateView: () => import("xstate").ActionFunction<import("./machine.setup").Context, import("./machine.setup").Events, import("./machine.setup").Events, undefined, import("xstate").Values<{
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
