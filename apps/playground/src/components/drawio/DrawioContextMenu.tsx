import { usePlayground } from '$/hooks/usePlayground'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { DrawioContextMenuDropdown } from './DrawioContextMenuDropdown'
import { useDrawioContextMenuActions } from './useDrawioContextMenuActions'

type DrawioContextMenuProps = {
  /** Render prop: pass the context menu handler to the diagram's onCanvasContextMenu */
  children: (onCanvasContextMenu: (event: React.MouseEvent | MouseEvent) => void) => React.ReactNode
  /** Current diagram view (for export). Must be layouted. */
  diagram: DiagramView | null
  /** Model for $styles when exporting */
  likec4model: LikeC4Model | null
  /** Optional: .c4 source to apply round-trip options (layout, strokes, waypoints) on export */
  getSourceContent?: () => string | undefined
}

/**
 * Provides DrawIO Import / Export actions and renders a context menu
 * that opens on the given onContextMenu event.
 */
export function DrawioContextMenu({
  children,
  diagram,
  likec4model,
  getSourceContent,
}: DrawioContextMenuProps) {
  const playground = usePlayground()
  const actions = useDrawioContextMenuActions({
    diagram,
    likec4model,
    ...(getSourceContent !== undefined && { getSourceContent }),
  })

  return (
    <>
      <DrawioContextMenuDropdown
        menuPosition={actions.menuPosition}
        opened={actions.opened}
        onClose={actions.close}
        onExport={actions.handleExport}
        onExportAllViews={actions.handleExportAllViews}
        canExport={actions.canExport}
        canExportAllViews={actions.canExportAllViews}
      />
      {children(actions.openMenu)}
    </>
  )
}
