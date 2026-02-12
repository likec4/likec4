import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { useDisclosure } from '@mantine/hooks'
import { useCallback, useState } from 'react'
import { DrawioContextMenuView } from './DrawioContextMenuView'
import { useDrawioActions } from './useDrawioActions'

type DrawioContextMenuProps = {
  /** Render prop: pass the context menu handler to the diagram's onCanvasContextMenu */
  children: (onCanvasContextMenu: (event: React.MouseEvent) => void) => React.ReactNode
  /** Current diagram view (for export). Must be layouted. */
  diagram: DiagramView | null
  /** Model for $styles when exporting */
  likec4model: LikeC4Model | null
}

/**
 * Provides DrawIO Import / Export actions and renders a context menu
 * that opens on the given onContextMenu event.
 */
export function DrawioContextMenu({
  children,
  diagram,
  likec4model,
}: DrawioContextMenuProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const {
    fileInputRef,
    handleImportFile,
    handleExport,
    triggerImport,
    canExport,
    DRAWIO_ACCEPT,
  } = useDrawioActions({ diagram, likec4model })

  const handleCanvasContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setMenuPosition({ x: event.clientX, y: event.clientY })
    open()
  }, [open])

  const handleImport = useCallback(() => {
    close()
    triggerImport()
  }, [close, triggerImport])

  const handleExportClick = useCallback(() => {
    close()
    handleExport()
  }, [close, handleExport])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={DRAWIO_ACCEPT}
        style={{ display: 'none' }}
        onChange={handleImportFile}
        aria-hidden
      />
      <DrawioContextMenuView
        opened={opened}
        onClose={close}
        menuPosition={menuPosition}
        onImport={handleImport}
        onExport={handleExportClick}
        canExport={canExport}
      />
      {children(handleCanvasContextMenu)}
    </>
  )
}
