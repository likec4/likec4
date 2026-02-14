import { usePlayground, usePlaygroundSnapshot } from '$/hooks/usePlayground';
import { useCallbackRef } from '@mantine/hooks';
import { createContext, useCallback, useContext, useEffect, useMemo, } from 'react';
import { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT } from './drawio-events';
import { DrawioContextMenuDropdown } from './DrawioContextMenuDropdown';
import { useDrawioContextMenuActions, } from './useDrawioContextMenuActions';
export { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT };
const DrawioContextMenuContext = createContext(null);
/** Snapshot when playground is not ready (no diagram, no model, empty files/viewStates). */
const EMPTY_DRAWIO_SNAPSHOT = {
    diagram: null,
    likec4model: null,
    files: {},
    viewStates: {},
};
/** Returns the DrawIO context menu API; throws if used outside DrawioContextMenuProvider. */
export function useDrawioContextMenu() {
    const api = useContext(DrawioContextMenuContext);
    if (!api) {
        throw new Error('useDrawioContextMenu must be used within DrawioContextMenuProvider');
    }
    return api;
}
/** Returns the DrawIO context menu API or null when not inside DrawioContextMenuProvider. */
export function useOptionalDrawioContextMenu() {
    return useContext(DrawioContextMenuContext);
}
/** Provides DrawIO export (and future import) context menu; wires LSP/model/source for useDrawioContextMenuActions. */
export function DrawioContextMenuProvider({ children, layoutedModelApi, onExportError, }) {
    const playground = usePlayground();
    const { diagram, likec4model, files, viewStates } = usePlaygroundSnapshot(c => {
        if (c.value !== 'ready')
            return EMPTY_DRAWIO_SNAPSHOT;
        const viewState = c.context.activeViewId ? c.context.viewStates[c.context.activeViewId] : null;
        const diagram = viewState?.state === 'success' ? viewState.diagram : null;
        return {
            diagram: diagram ?? null,
            likec4model: c.context.likec4model,
            files: c.context.files ?? {},
            viewStates: c.context.viewStates ?? {},
        };
    });
    const getSourceContent = useCallback(() => {
        const contents = Object.values(files).filter(Boolean);
        return contents.length > 0 ? contents.join('\n\n') : undefined;
    }, [files]);
    const actions = useDrawioContextMenuActions({
        diagram,
        likec4model,
        viewStates,
        getSourceContent,
        ...(onExportError != null && { onExportError }),
        ...(layoutedModelApi && {
            getLayoutedModel: layoutedModelApi.getLayoutedModel,
            layoutViews: layoutedModelApi.layoutViews,
        }),
    });
    const onExport = useCallbackRef(actions.handleExport);
    useEffect(() => {
        window.addEventListener(DRAWIO_EXPORT_EVENT, onExport);
        return () => window.removeEventListener(DRAWIO_EXPORT_EVENT, onExport);
    }, [onExport]);
    const api = useMemo(() => ({ openMenu: actions.openMenu }), [actions.openMenu]);
    return (<DrawioContextMenuContext.Provider value={api}>
      <DrawioContextMenuDropdown menuPosition={actions.menuPosition} opened={actions.opened} onClose={actions.close} onExport={actions.handleExport} onExportAllViews={actions.handleExportAllViews} canExport={actions.canExport} canExportAllViews={actions.canExportAllViews}/>
      {children}
    </DrawioContextMenuContext.Provider>);
}
