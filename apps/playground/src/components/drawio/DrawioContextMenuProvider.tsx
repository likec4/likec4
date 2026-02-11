import { usePlaygroundSnapshot } from '$/hooks/usePlayground'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { useDisclosure } from '@mantine/hooks'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT } from './drawio-events'
import { DrawioContextMenuView } from './DrawioContextMenuView'
import { useDrawioActions } from './useDrawioActions'

export { DRAWIO_IMPORT_EVENT, DRAWIO_EXPORT_EVENT }

export type DrawioContextMenuApi = {
  openMenu: (event: React.MouseEvent) => void
}

const DrawioContextMenuContext = createContext<DrawioContextMenuApi | null>(null)

export function useDrawioContextMenu(): DrawioContextMenuApi {
  const api = useContext(DrawioContextMenuContext)
  if (!api) {
    throw new Error('useDrawioContextMenu must be used within DrawioContextMenuProvider')
  }
  return api
}

export function useOptionalDrawioContextMenu(): DrawioContextMenuApi | null {
  return useContext(DrawioContextMenuContext)
}

export function DrawioContextMenuProvider({ children }: PropsWithChildren) {
  const { diagram, likec4model } = usePlaygroundSnapshot(c => {
    if (c.value !== 'ready') {
      return { diagram: null as DiagramView | null, likec4model: null as LikeC4Model | null }
    }
    const viewState = c.context.activeViewId ? c.context.viewStates[c.context.activeViewId] : null
    const diagram = viewState?.state === 'success' ? viewState.diagram : null
    return {
      diagram: diagram ?? null,
      likec4model: c.context.likec4model,
    }
  })
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

  const openMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      setMenuPosition({ x: event.clientX, y: event.clientY })
      open()
    },
    [open],
  )

  const handleImport = useCallback(() => {
    close()
    triggerImport()
  }, [close, triggerImport])

  const handleExportClick = useCallback(() => {
    close()
    handleExport()
  }, [close, handleExport])

  useEffect(() => {
    window.addEventListener(DRAWIO_IMPORT_EVENT, triggerImport)
    window.addEventListener(DRAWIO_EXPORT_EVENT, handleExport)
    return () => {
      window.removeEventListener(DRAWIO_IMPORT_EVENT, triggerImport)
      window.removeEventListener(DRAWIO_EXPORT_EVENT, handleExport)
    }
  }, [triggerImport, handleExport])

  const api: DrawioContextMenuApi = { openMenu }

  return (
    <DrawioContextMenuContext.Provider value={api}>
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
      {children}
    </DrawioContextMenuContext.Provider>
  )
}
