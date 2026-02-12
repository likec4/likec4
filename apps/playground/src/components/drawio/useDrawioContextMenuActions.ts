import type { LayoutedLikeC4ModelData } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import {
  buildDrawioExportOptionsFromSource,
  DEFAULT_DRAWIO_ALL_FILENAME,
  generateDrawio,
  generateDrawioMulti,
} from '@likec4/generators'
import type { GenerateDrawioOptions } from '@likec4/generators'
import { useDisclosure } from '@mantine/hooks'
import { useCallback, useMemo, useState } from 'react'
import { DRAWIO_MIME_TYPE } from './drawio-events'

/** Delay (ms) before revoking object URL after download so the browser can start the download. */
const DRAWIO_DOWNLOAD_REVOKE_MS = 1000

type ViewModelLike = { $view: DiagramView; get $styles(): LikeC4Model['$styles'] | null }

/** Single place for "blob → object URL → download link → revoke" (DRY). */
function downloadDrawioBlob(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: DRAWIO_MIME_TYPE })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), DRAWIO_DOWNLOAD_REVOKE_MS)
}

/** Build viewmodel shape expected by generateDrawio / generateDrawioMulti (single responsibility). */
function toViewModel(view: DiagramView, styles: LikeC4Model['$styles'] | null): ViewModelLike {
  return {
    $view: view,
    get $styles() {
      return styles ?? null
    },
  }
}

export type DiagramStateLike = {
  state: string
  diagram?: DiagramView | null
}

export type UseDrawioContextMenuActionsParams = {
  diagram: DiagramView | null
  likec4model: LikeC4Model | null
  viewStates?: Record<string, DiagramStateLike>
  /** Optional: .c4 source content to parse round-trip comment blocks for re-export (layout, strokes, waypoints). */
  getSourceContent?: () => string | undefined
  /** Optional: fetch full layouted model from LSP so "Export all views" includes every view as a tab. */
  getLayoutedModel?: () => Promise<LayoutedLikeC4ModelData | null>
  /** Optional: layout each view by id and return diagrams (fallback when getLayoutedModel returns fewer views). */
  layoutViews?: (viewIds: string[]) => Promise<Record<string, DiagramView>>
}

/** Gather all view models needed for "Export all views" (single responsibility; testable). */
async function collectViewModelsForExportAll(
  viewIdsInModel: string[],
  allViewModelsFromState: ViewModelLike[],
  likec4model: LikeC4Model | null,
  viewStates: Record<string, DiagramStateLike>,
  getLayoutedModel: (() => Promise<LayoutedLikeC4ModelData | null>) | undefined,
  layoutViews: ((viewIds: string[]) => Promise<Record<string, DiagramView>>) | undefined,
): Promise<ViewModelLike[]> {
  if (!likec4model || viewIdsInModel.length === 0) return []
  const styles = likec4model.$styles
  const byId = new Map<string, ViewModelLike>()
  for (const vm of allViewModelsFromState) byId.set(vm.$view.id, vm)
  if (getLayoutedModel) {
    try {
      const model = await getLayoutedModel()
      if (model?.views && typeof model.views === 'object') {
        for (const view of Object.values(model.views)) {
          byId.set(view.id, toViewModel(view, styles ?? null))
        }
      }
    } catch (e) {
      console.error('DrawIO export: failed to fetch layouted model', e)
    }
  }
  for (const viewId of viewIdsInModel) {
    if (!byId.has(viewId)) {
      const state = viewStates[viewId]
      if (state?.state === 'success' && state.diagram) {
        byId.set(viewId, toViewModel(state.diagram, styles ?? null))
      }
    }
  }
  const missing = viewIdsInModel.filter(id => !byId.has(id))
  if (missing.length > 0 && layoutViews) {
    try {
      const diagrams = await layoutViews(missing)
      for (const viewId of missing) {
        const diagram = diagrams[viewId]
        if (diagram) byId.set(viewId, toViewModel(diagram, styles ?? null))
      }
    } catch (e) {
      console.error('DrawIO export: layoutViews failed', e)
    }
  }
  for (const viewId of viewIdsInModel) {
    if (!byId.has(viewId)) {
      try {
        const vm = likec4model.view(viewId as Parameters<LikeC4Model['view']>[0])
        if (vm?.$view) byId.set(viewId, toViewModel(vm.$view as DiagramView, styles ?? null))
      } catch {
        // view might not exist for this id
      }
    }
  }
  return viewIdsInModel.map(id => byId.get(id)).filter(Boolean) as ViewModelLike[]
}

export function useDrawioContextMenuActions({
  diagram,
  likec4model,
  viewStates = {},
  getSourceContent,
  getLayoutedModel,
  layoutViews,
}: UseDrawioContextMenuActionsParams) {
  const allViewModelsFromState = useMemo(() => {
    if (!likec4model) return []
    const styles = likec4model.$styles
    return (Object.values(viewStates) ?? [])
      .filter((vs): vs is DiagramStateLike & { diagram: DiagramView } => vs?.state === 'success' && !!vs.diagram)
      .map(vs => toViewModel(vs.diagram!, styles ?? null))
  }, [likec4model, viewStates])
  const [opened, { open, close }] = useDisclosure(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const openMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
    setMenuPosition({ x: event.clientX, y: event.clientY })
    open()
  }, [open])

  const handleExport = useCallback(async () => {
    close()
    if (!diagram) return
    try {
      // Prefer layouted diagram so export has correct positions (avoids all nodes sharing default bbox)
      let viewToExport = diagram
      if (layoutViews) {
        try {
          const diagrams = await layoutViews([diagram.id])
          const layouted = diagrams[diagram.id]
          if (layouted) viewToExport = layouted
        } catch {
          // use current diagram if layout fetch fails
        }
      }
      const viewmodel = toViewModel(viewToExport, likec4model?.$styles ?? null)
      const options = buildDrawioExportOptionsFromSource(diagram.id, getSourceContent?.())
      const xml = generateDrawio(
        viewmodel as Parameters<typeof generateDrawio>[0],
        options,
      )
      downloadDrawioBlob(xml, `${diagram.id}.drawio`)
    } catch (err) {
      console.error('DrawIO export failed', err)
    }
  }, [close, diagram, likec4model, getSourceContent, layoutViews])

  const handleExportAllViews = useCallback(async () => {
    close()
    if (!likec4model) return
    const viewIdsInModel = [...likec4model.views()].map(vm => vm.$view.id)
    const viewModels = await collectViewModelsForExportAll(
      viewIdsInModel,
      allViewModelsFromState,
      likec4model,
      viewStates,
      getLayoutedModel,
      layoutViews,
    )
    if (viewModels.length === 0) return
    try {
      const sourceContent = getSourceContent?.()
      const optionsByViewId: Record<string, GenerateDrawioOptions> = {}
      for (const vm of viewModels) {
        optionsByViewId[vm.$view.id] = buildDrawioExportOptionsFromSource(vm.$view.id, sourceContent)
      }
      const xml = generateDrawioMulti(
        viewModels as Parameters<typeof generateDrawioMulti>[0],
        optionsByViewId,
      )
      downloadDrawioBlob(xml, DEFAULT_DRAWIO_ALL_FILENAME)
    } catch (err) {
      console.error('DrawIO export all views failed', err)
    }
  }, [close, allViewModelsFromState, getSourceContent, getLayoutedModel, layoutViews, likec4model, viewStates])

  return {
    openMenu,
    handleExport,
    handleExportAllViews,
    menuPosition,
    opened,
    close,
    canExport: diagram != null,
    canExportAllViews: allViewModelsFromState.length > 0 || (!!getLayoutedModel && !!likec4model),
  }
}
