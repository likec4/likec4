import type { LayoutedLikeC4ModelData } from '@likec4/core';
import type { DiagramView } from '@likec4/core/types';
import { type PropsWithChildren } from 'react';
import { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT } from './drawio-events';
import { type OnDrawioExportError } from './useDrawioContextMenuActions';
export { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT };
/** API to fetch layouted model / per-view diagrams from LSP (used for "Export all views"). */
export type LayoutedModelApi = {
    getLayoutedModel: () => Promise<LayoutedLikeC4ModelData | null>;
    layoutViews: (viewIds: string[]) => Promise<Record<string, DiagramView>>;
};
/** API exposed by DrawioContextMenuProvider: open the context menu at the given event. */
export type DrawioContextMenuApi = {
    openMenu: (event: React.MouseEvent | MouseEvent) => void;
};
/** Returns the DrawIO context menu API; throws if used outside DrawioContextMenuProvider. */
export declare function useDrawioContextMenu(): DrawioContextMenuApi;
/** Returns the DrawIO context menu API or null when not inside DrawioContextMenuProvider. */
export declare function useOptionalDrawioContextMenu(): DrawioContextMenuApi | null;
/** Provides DrawIO export (and future import) context menu; wires LSP/model/source for useDrawioContextMenuActions. */
export declare function DrawioContextMenuProvider({ children, layoutedModelApi, onExportError, }: PropsWithChildren<{
    layoutedModelApi?: LayoutedModelApi | null;
    /** Optional: called when export fails so UI can show toast/snackbar. */
    onExportError?: OnDrawioExportError;
}>): import("react").JSX.Element;
