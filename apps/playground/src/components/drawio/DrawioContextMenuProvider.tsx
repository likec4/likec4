import { usePlayground, usePlaygroundSnapshot } from '$/hooks/usePlayground'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
} from 'react'
import { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT } from './drawio-events'
import { DrawioContextMenuDropdown } from './DrawioContextMenuDropdown'
import { useDrawioContextMenuActions } from './useDrawioContextMenuActions'

export { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT }

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
  const playground = usePlayground()
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

  const onAddFile = useCallback(
    (filename: string, content: string) => {
      playground.actor.send({ type: 'workspace.addFile', filename, content })
    },
    [playground],
  )

  const actions = useDrawioContextMenuActions({
    diagram,
    likec4model,
    onAddFile,
  })

  useEffect(() => {
    const onImport = () => actions.handleImport()
    const onExport = () => actions.handleExport()
    window.addEventListener(DRAWIO_IMPORT_EVENT, onImport)
    window.addEventListener(DRAWIO_EXPORT_EVENT, onExport)
    return () => {
      window.removeEventListener(DRAWIO_IMPORT_EVENT, onImport)
      window.removeEventListener(DRAWIO_EXPORT_EVENT, onExport)
    }
  }, [actions.handleImport, actions.handleExport])

  const api: DrawioContextMenuApi = { openMenu: actions.openMenu }

  return (
    <DrawioContextMenuContext.Provider value={api}>
      <DrawioContextMenuDropdown
        fileInputRef={actions.fileInputRef}
        menuPosition={actions.menuPosition}
        opened={actions.opened}
        onClose={actions.close}
        onImport={actions.handleImport}
        onImportFile={actions.handleImportFile}
        onExport={actions.handleExport}
        canExport={actions.canExport}
      />
      {children}
    </DrawioContextMenuContext.Provider>
  )
}
