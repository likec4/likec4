import type * as t from '@likec4/core/types';
import type { DiagramActorSnapshot } from '../likec4diagram/state/types';
declare const selectCompareLayoutState: ({ context }: DiagramActorSnapshot) => {
    isEnabled: false;
    hasEditor: false;
    isEditable: false;
    isActive: false;
    drifts: never;
    canApplyLatest: boolean;
    layout: t.LayoutType;
} | {
    isEnabled: true;
    hasEditor: boolean;
    isEditable: boolean;
    isActive: boolean;
    drifts: readonly [t.LayoutedViewDriftReason, ...t.LayoutedViewDriftReason[]];
    canApplyLatest: boolean;
    layout: t.LayoutType;
};
export type DiagramCompareLayoutState = ReturnType<typeof selectCompareLayoutState>;
export type DiagramCompareLayoutOps = {
    /**
     * Toggles the compare mode on or off.
     */
    toggleCompare: (force?: 'on' | 'off') => void;
    /**
     * Switches the layout type between 'auto' and 'manual'.
     */
    switchLayout: (layoutType: t.LayoutType) => void;
    /**
     * Merges the latest layout into the manual layout.
     */
    applyLatestToManual: () => void;
    /**
     * Resets the manual layout to its default state.
     */
    resetManualLayout: () => void;
};
export declare function useDiagramCompareLayout(): [
    DiagramCompareLayoutState,
    DiagramCompareLayoutOps
];
export {};
