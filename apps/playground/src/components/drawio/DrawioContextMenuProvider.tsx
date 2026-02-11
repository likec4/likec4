import { usePlayground, usePlaygroundSnapshot } from '$/hooks/usePlayground'
import type { LayoutedLikeC4ModelData } from '@likec4/core'
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

/** API to fetch layouted model / per-view diagrams from LSP (used for "Export all views"). */
export type LayoutedModelApi = {
  getLayoutedModel: () => Promise<LayoutedLikeC4ModelData | null>
  layoutViews: (viewIds: string[]) => Promise<Record<string, DiagramView>>
}

export type DrawioContextMenuApi = {
  openMenu: (event: React.MouseEvent | MouseEvent) => void
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

export function DrawioContextMenuProvider({
  children,
  layoutedModelApi,
}: PropsWithChildren<{ layoutedModelApi?: LayoutedModelApi | null }>) {
  const playground = usePlayground()
  const { diagram, likec4model, files, viewStates } = usePlaygroundSnapshot(c => {
    if (c.value !== 'ready') {
      return {
        diagram: null as DiagramView | null,
        likec4model: null as LikeC4Model | null,
        files: {} as Record<string, string>,
        viewStates: {} as Record<string, { state: string; diagram?: DiagramView | null }>,
      }
    }
    const viewState = c.context.activeViewId ? c.context.viewStates[c.context.activeViewId] : null
    const diagram = viewState?.state === 'success' ? viewState.diagram : null
    return {
      diagram: diagram ?? null,
      likec4model: c.context.likec4model,
      files: c.context.files ?? {},
      viewStates: c.context.viewStates ?? {},
    }
  })

  const onAddFile = useCallback(
    (filename: string, content: string) => {
      playground.actor.send({ type: 'workspace.addFile', filename, content })
    },
    [playground],
  )

  const getSourceContent = useCallback(() => {
    const contents = Object.values(files).filter(Boolean)
    return contents.length > 0 ? contents.join('\n\n') : undefined
  }, [files])

  const actions = useDrawioContextMenuActions({
    diagram,
    likec4model,
    viewStates,
    onAddFile,
    getSourceContent,
    ...(layoutedModelApi && {
      getLayoutedModel: layoutedModelApi.getLayoutedModel,
      layoutViews: layoutedModelApi.layoutViews,
    }),
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
        onExportAllViews={actions.handleExportAllViews}
        canExport={actions.canExport}
        canExportAllViews={actions.canExportAllViews}
      />
      {children}
    </DrawioContextMenuContext.Provider>
  )
}
