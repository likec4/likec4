import { DrawioContextMenuDropdown } from './DrawioContextMenuDropdown';
import { useDrawioContextMenuActions } from './useDrawioContextMenuActions';
/**
 * Provides DrawIO Import / Export actions and renders a context menu
 * that opens on the given onContextMenu event.
 */
export function DrawioContextMenu({ children, diagram, likec4model, getSourceContent, }) {
    const actions = useDrawioContextMenuActions({
        diagram,
        likec4model,
        ...(getSourceContent !== undefined && { getSourceContent }),
    });
    return (<>
      <DrawioContextMenuDropdown menuPosition={actions.menuPosition} opened={actions.opened} onClose={actions.close} onExport={actions.handleExport} onExportAllViews={actions.handleExportAllViews} canExport={actions.canExport} canExportAllViews={actions.canExportAllViews}/>
      {children(actions.openMenu)}
    </>);
}
