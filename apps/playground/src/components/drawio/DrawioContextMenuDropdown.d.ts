/** Props for DrawioContextMenuDropdown (position, open state, export callbacks, and capability flags). */
export type DrawioContextMenuDropdownProps = {
    menuPosition: {
        x: number;
        y: number;
    };
    opened: boolean;
    onClose: () => void;
    onExport: () => void;
    onExportAllViews?: () => void;
    canExport: boolean;
    canExportAllViews?: boolean;
};
/**
 * Presentational component: DrawIO context menu dropdown (export only).
 * Logic is provided by useDrawioContextMenuActions.
 */
export declare function DrawioContextMenuDropdown({ menuPosition, opened, onClose, onExport, onExportAllViews, canExport, canExportAllViews, }: DrawioContextMenuDropdownProps): import("react").JSX.Element;
