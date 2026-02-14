import type { ViewChange } from '@likec4/core/types';
export declare const raiseSync: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, never, never, never, "500ms" | "waitBeforeSync", never>;
export declare const cancelSync: () => import("xstate").CancelAction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, undefined, import("./editorActor.setup").EditorActorEvent>;
export declare const reschedule: (delay?: number) => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, never, never, never, "500ms" | "waitBeforeSync", never>;
type LayoutChanges = ViewChange.ResetManualLayout | ViewChange.SaveViewSnapshot;
export declare const isLayoutChange: (change: ViewChange) => change is LayoutChanges;
export declare const withoutSnapshotChanges: (data: ViewChange[]) => any[];
export declare const saveStateBeforeEdit: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, never, never, never>;
export declare const startEditing: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, import("xstate").Values<{
    "has pending": {
        type: "has pending";
        params: unknown;
    };
    "can undo": {
        type: "can undo";
        params: unknown;
    };
}>, "500ms" | "waitBeforeSync", import("./editorActor.setup").EditorActorEmitedEvent>;
export declare const stopHotkey: () => import("xstate").StopAction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, undefined, import("./editorActor.setup").EditorActorEvent>;
export declare const ensureHotKey: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, import("xstate").Values<{
    "has pending": {
        type: "has pending";
        params: unknown;
    };
    "can undo": {
        type: "can undo";
        params: unknown;
    };
}>, "500ms" | "waitBeforeSync", import("./editorActor.setup").EditorActorEmitedEvent>;
export declare const pushHistory: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, never, never, never>;
export declare const stopEditing: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, import("xstate").Values<{
    "has pending": {
        type: "has pending";
        params: unknown;
    };
    "can undo": {
        type: "can undo";
        params: unknown;
    };
}>, "500ms" | "waitBeforeSync", import("./editorActor.setup").EditorActorEmitedEvent>;
export declare const markHistoryAsSynched: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, never, never, never>;
export declare const popHistory: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, never, never, never>;
export declare const undo: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, import("xstate").Values<{
    "has pending": {
        type: "has pending";
        params: unknown;
    };
    "can undo": {
        type: "can undo";
        params: unknown;
    };
}>, "500ms" | "waitBeforeSync", import("./editorActor.setup").EditorActorEmitedEvent>;
export declare const addSnapshotToPendingChanges: () => import("xstate").ActionFunction<import("./editorActor.setup").EditorActorContext, import("./editorActor.setup").EditorActorEvent, import("./editorActor.setup").EditorActorEvent, undefined, import("xstate").Values<{
    hotkey: {
        src: "hotkey";
        logic: import("./hotkeyActor").HotkeyActorLogic;
        id: "hotkey";
    };
    applyLatest: {
        src: "applyLatest";
        logic: import("xstate").PromiseActorLogic<import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Output, import("./editorActor.setup").EditorCalls.ApplyLatestToManual.Input, import("xstate").EventObject>;
        id: string;
    };
    executeChange: {
        src: "executeChange";
        logic: import("xstate").PromiseActorLogic<{}, import("./editorActor.setup").EditorCalls.ExecuteChange.Input, import("xstate").EventObject>;
        id: string;
    };
}>, never, never, never, never>;
export {};
