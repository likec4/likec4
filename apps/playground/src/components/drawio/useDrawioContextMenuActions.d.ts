import type { LayoutedLikeC4ModelData } from '@likec4/core';
import type { LikeC4Model } from '@likec4/core/model';
import type { DiagramView } from '@likec4/core/types';
/** Callback when export fails; single type for params and report helper (DRY). */
export type OnDrawioExportError = (message: string, err: unknown) => void;
/** Per-view state for DrawIO export (e.g. from XState); diagram present when state is success. */
export type DiagramStateLike = {
    state: string;
    diagram?: DiagramView | null;
};
/** Parameters for useDrawioContextMenuActions (diagram, model, optional LSP/source callbacks). */
export type UseDrawioContextMenuActionsParams = {
    diagram: DiagramView | null;
    likec4model: LikeC4Model | null;
    viewStates?: Record<string, DiagramStateLike>;
    /** Optional: .c4 source content to parse round-trip comment blocks for re-export (layout, strokes, waypoints). */
    getSourceContent?: () => string | undefined;
    /** Optional: fetch full layouted model from LSP so "Export all views" includes every view as a tab. */
    getLayoutedModel?: () => Promise<LayoutedLikeC4ModelData | null>;
    /** Optional: layout each view by id and return diagrams (fallback when getLayoutedModel returns fewer views). */
    layoutViews?: (viewIds: string[]) => Promise<Record<string, DiagramView>>;
    /** Optional: called when export fails so UI can show toast/snackbar; otherwise errors are only logged to console. */
    onExportError?: OnDrawioExportError;
};
/**
 * Hook that builds DrawIO export actions (single view and "Export all") for the context menu.
 * Uses diagram + likec4model; optionally getSourceContent, getLayoutedModel, layoutViews for round-trip and multi-view export.
 */
export declare function useDrawioContextMenuActions({ diagram, likec4model, viewStates, getSourceContent, getLayoutedModel, layoutViews, onExportError, }: UseDrawioContextMenuActionsParams): {
    openMenu: (event: React.MouseEvent | MouseEvent) => void;
    handleExport: () => Promise<void>;
    handleExportAllViews: () => Promise<void>;
    menuPosition: {
        x: number;
        y: number;
    };
    opened: any;
    close: any;
    canExport: boolean;
    canExportAllViews: boolean;
};
