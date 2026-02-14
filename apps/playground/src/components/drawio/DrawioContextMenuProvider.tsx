import { usePlaygroundSnapshot } from '$/hooks/usePlayground'
import type { LayoutedLikeC4ModelData } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { useCallbackRef } from '@mantine/hooks'
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT } from './drawio-events'
import { DrawioContextMenuDropdown } from './DrawioContextMenuDropdown'
import {
  type DiagramStateLike,
  type OnDrawioExportError,
  useDrawioContextMenuActions,
} from './useDrawioContextMenuActions'

export { DRAWIO_EXPORT_EVENT, DRAWIO_IMPORT_EVENT }

/** API to fetch layouted model / per-view diagrams from LSP (used for "Export all views"). */
export type LayoutedModelApi = {
  getLayoutedModel: () => Promise<LayoutedLikeC4ModelData | null>
  layoutViews: (viewIds: string[]) => Promise<Record<string, DiagramView>>
}

/** API exposed by DrawioContextMenuProvider: open the context menu at the given event. */
export type DrawioContextMenuApi = {
  openMenu: (event: React.MouseEvent | MouseEvent) => void
}

const DrawioContextMenuContext = createContext<DrawioContextMenuApi | null>(null)

/** Snapshot when playground is not ready (no diagram, no model, empty files/viewStates). */
const EMPTY_DRAWIO_SNAPSHOT: {
  diagram: DiagramView | null
  likec4model: LikeC4Model | null
  files: Record<string, string>
  viewStates: Record<string, DiagramStateLike>
} = {
  diagram: null,
  likec4model: null,
  files: {},
  viewStates: {},
}

/** Returns the DrawIO context menu API; throws if used outside DrawioContextMenuProvider. */
export function useDrawioContextMenu(): DrawioContextMenuApi {
  const api = useContext(DrawioContextMenuContext)
  if (!api) {
    throw new Error('useDrawioContextMenu must be used within DrawioContextMenuProvider')
  }
  return api
}

/** Returns the DrawIO context menu API or null when not inside DrawioContextMenuProvider. */
export function useOptionalDrawioContextMenu(): DrawioContextMenuApi | null {
  return useContext(DrawioContextMenuContext)
}

/** Provides DrawIO export (and future import) context menu; wires LSP/model/source for useDrawioContextMenuActions. */
export function DrawioContextMenuProvider({
  children,
  layoutedModelApi,
  onExportError,
}: PropsWithChildren<{
  layoutedModelApi?: LayoutedModelApi | null
  /** Optional: called when export fails so UI can show toast/snackbar. */
  onExportError?: OnDrawioExportError
}>) {
  const { diagram, likec4model, files, viewStates } = usePlaygroundSnapshot(c => {
    if (c.value !== 'ready') return EMPTY_DRAWIO_SNAPSHOT
    const viewState = c.context.activeViewId ? c.context.viewStates[c.context.activeViewId] : null
    const diagram = viewState?.state === 'success' ? viewState.diagram : null
    return {
      diagram: diagram ?? null,
      likec4model: c.context.likec4model,
      files: c.context.files ?? {},
      viewStates: c.context.viewStates ?? {},
    }
  })

  const filesRef = useRef(files)
  useEffect(() => {
    filesRef.current = files
  }, [files])
  const getSourceContent = useCallback(() => {
    const contents = Object.values(filesRef.current).filter(Boolean)
    return contents.length > 0 ? contents.join('\n\n') : undefined
  }, [])

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
  })

  // useCallbackRef keeps the listener stable so the effect does not churn add/remove on every actions.handleExport identity change
  const onExport = useCallbackRef(actions.handleExport)
  useEffect(() => {
    window.addEventListener(DRAWIO_EXPORT_EVENT, onExport)
    return () => window.removeEventListener(DRAWIO_EXPORT_EVENT, onExport)
  }, [onExport])

  const api = useMemo<DrawioContextMenuApi>(
    () => ({ openMenu: actions.openMenu }),
    [actions.openMenu],
  )

  return (
    <DrawioContextMenuContext.Provider value={api}>
      <DrawioContextMenuDropdown
        menuPosition={actions.menuPosition}
        opened={actions.opened}
        onClose={actions.close}
        onExport={actions.handleExport}
        onExportAllViews={actions.handleExportAllViews}
        canExport={actions.canExport}
        canExportAllViews={actions.canExportAllViews}
      />
      {children}
    </DrawioContextMenuContext.Provider>
  )
}
