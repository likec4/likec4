/**
 * State for handling navigation to a different view.
 * Closes overlays and search, stops sync layout and fit diagram actions,
 * then processes the view update and transitions back to idle state.
 */
export declare const navigating: {
    id: string;
    always: {
        actions: import("xstate").CancelAction<import("./machine.setup").Context, import("./machine.setup").Events, undefined, import("./machine.setup").Events>[];
        target: string;
    };
};
