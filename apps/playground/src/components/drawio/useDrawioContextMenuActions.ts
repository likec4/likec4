import { LikeC4Styles } from '@likec4/core'
import type { LayoutedLikeC4ModelData } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import {
  buildDrawioExportOptionsForViews,
  buildDrawioExportOptionsFromSource,
  DEFAULT_DRAWIO_ALL_FILENAME,
  generateDrawio,
  generateDrawioMulti,
} from '@likec4/generators'
import type { DrawioViewModelLike, GenerateDrawioOptions } from '@likec4/generators'
import { useDisclosure } from '@mantine/hooks'
import { useCallback, useMemo, useState } from 'react'
import { DRAWIO_MIME_TYPE } from './drawio-events'

/** Delay (ms) before revoking object URL after download so the browser can start the download. */
const DRAWIO_DOWNLOAD_REVOKE_MS = 1000

/** Single place for "blob → object URL → download link → revoke" (DRY). */
function downloadDrawioBlob(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: DRAWIO_MIME_TYPE })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), DRAWIO_DOWNLOAD_REVOKE_MS)
}

/** Build viewmodel shape expected by generateDrawio / generateDrawioMulti (single responsibility). */
function toViewModel(view: DiagramView, styles: LikeC4Model['$styles'] | null): DrawioViewModelLike {
  return {
    $view: view,
    get $styles() {
      return styles ?? LikeC4Styles.DEFAULT
    },
  }
}

/** Callback when export fails; single type for params and report helper (DRY). */
export type OnDrawioExportError = (message: string, err: unknown) => void

/** Single place to report export errors: callback when provided, else console (no silent failure). */
function reportExportError(
  message: string,
  err: unknown,
  onExportError?: OnDrawioExportError,
): void {
  if (onExportError) onExportError(message, err)
  else console.error(message, err)
}

/** Per-view state for DrawIO export (e.g. from XState); diagram present when state is success. */
export type DiagramStateLike = {
  state: string
  diagram?: DiagramView | null
}

/** Parameters for useDrawioContextMenuActions (diagram, model, optional LSP/source callbacks). */
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
  /** Optional: called when export fails so UI can show toast/snackbar; otherwise errors are only logged to console. */
  onExportError?: OnDrawioExportError
}

/** Options for collectViewModelsForExportAll (single object keeps signature stable). */
interface CollectViewModelsOptions {
  viewIdsInModel: string[]
  allViewModelsFromState: DrawioViewModelLike[]
  likec4model: LikeC4Model | null
  viewStates: Record<string, DiagramStateLike>
  getLayoutedModel: (() => Promise<LayoutedLikeC4ModelData | null>) | undefined
  layoutViews: ((viewIds: string[]) => Promise<Record<string, DiagramView>>) | undefined
  onExportError?: OnDrawioExportError
}

/** Phase 1: fill byId from layouted model (LSP). */
async function fillFromLayoutedModel(
  byId: Map<string, DrawioViewModelLike>,
  getLayoutedModel: () => Promise<LayoutedLikeC4ModelData | null>,
  styles: LikeC4Model['$styles'] | null,
  onExportError?: OnDrawioExportError,
): Promise<void> {
  try {
    const model = await getLayoutedModel()
    if (model?.views && typeof model.views === 'object') {
      for (const view of Object.values(model.views)) {
        byId.set(view.id, toViewModel(view, styles))
      }
    }
  } catch (e) {
    reportExportError('DrawIO export: failed to fetch layouted model', e, onExportError)
  }
}

/** Phase 2: fill byId from viewStates (already loaded in UI). */
function fillFromViewStates(
  byId: Map<string, DrawioViewModelLike>,
  viewIdsInModel: string[],
  viewStates: Record<string, DiagramStateLike>,
  styles: LikeC4Model['$styles'] | null,
): void {
  for (const viewId of viewIdsInModel) {
    if (!byId.has(viewId)) {
      const state = viewStates[viewId]
      if (state?.state === 'success' && state.diagram) {
        byId.set(viewId, toViewModel(state.diagram, styles))
      }
    }
  }
}

/** Phase 3: fill byId for missing ids via layoutViews. */
async function fillFromLayoutViews(
  byId: Map<string, DrawioViewModelLike>,
  missing: string[],
  layoutViews: (viewIds: string[]) => Promise<Record<string, DiagramView>>,
  styles: LikeC4Model['$styles'] | null,
  onExportError?: OnDrawioExportError,
): Promise<void> {
  try {
    const diagrams = await layoutViews(missing)
    for (const viewId of missing) {
      const diagram = diagrams[viewId]
      if (diagram) byId.set(viewId, toViewModel(diagram, styles))
    }
  } catch (e) {
    reportExportError('DrawIO export: layoutViews failed', e, onExportError)
  }
}

/** Phase 4: fallback fill from likec4model.view(id). */
function fillFromModelView(
  byId: Map<string, DrawioViewModelLike>,
  viewIdsInModel: string[],
  likec4model: LikeC4Model,
  styles: LikeC4Model['$styles'] | null,
): void {
  for (const viewId of viewIdsInModel) {
    if (!byId.has(viewId)) {
      try {
        // Casts bridge generic model API (ViewId) and LayoutedView to concrete DiagramView for DrawIO export
        const vm = likec4model.view(viewId as Parameters<LikeC4Model['view']>[0])
        if (vm?.$view) byId.set(viewId, toViewModel(vm.$view as DiagramView, styles))
      } catch {
        // view might not exist for this id
      }
    }
  }
}

/** Gather all view models needed for "Export all views" (single responsibility; testable). */
async function collectViewModelsForExportAll(options: CollectViewModelsOptions): Promise<DrawioViewModelLike[]> {
  const {
    viewIdsInModel,
    allViewModelsFromState,
    likec4model,
    viewStates,
    getLayoutedModel,
    layoutViews,
    onExportError,
  } = options
  if (!likec4model || viewIdsInModel.length === 0) return []
  const styles = likec4model.$styles ?? null
  const byId = new Map<string, DrawioViewModelLike>()
  for (const vm of allViewModelsFromState) byId.set(vm.$view.id, vm)
  if (getLayoutedModel) await fillFromLayoutedModel(byId, getLayoutedModel, styles, onExportError)
  fillFromViewStates(byId, viewIdsInModel, viewStates, styles)
  const missing = viewIdsInModel.filter(id => !byId.has(id))
  if (missing.length > 0 && layoutViews) {
    await fillFromLayoutViews(byId, missing, layoutViews, styles, onExportError)
  }
  fillFromModelView(byId, viewIdsInModel, likec4model, styles)
  return viewIdsInModel.map(id => byId.get(id)).filter(Boolean) as DrawioViewModelLike[]
}

/**
 * Hook that builds DrawIO export actions (single view and "Export all") for the context menu.
 * Uses diagram + likec4model; optionally getSourceContent, getLayoutedModel, layoutViews for round-trip and multi-view export.
 */
export function useDrawioContextMenuActions({
  diagram,
  likec4model,
  viewStates = {},
  getSourceContent,
  getLayoutedModel,
  layoutViews,
  onExportError,
}: UseDrawioContextMenuActionsParams) {
  const allViewModelsFromState = useMemo(() => {
    if (!likec4model) return []
    const styles = likec4model.$styles
    return Object.values(viewStates)
      .filter((vs): vs is DiagramStateLike & { diagram: DiagramView } => vs?.state === 'success' && !!vs.diagram)
      .map(vs => toViewModel(vs.diagram, styles ?? null))
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
      const xml = generateDrawio(viewmodel, options)
      downloadDrawioBlob(xml, `${diagram.id}.drawio`)
    } catch (err) {
      reportExportError('DrawIO export failed', err, onExportError)
    }
  }, [close, diagram, likec4model, getSourceContent, layoutViews, onExportError])

  const handleExportAllViews = useCallback(async () => {
    close()
    if (!likec4model) return
    const viewIdsInModel = [...likec4model.views()].map(vm => vm.$view.id)
    const viewModels = await collectViewModelsForExportAll({
      viewIdsInModel,
      allViewModelsFromState,
      likec4model,
      viewStates,
      getLayoutedModel,
      layoutViews,
      ...(onExportError != null && { onExportError }),
    })
    if (viewModels.length === 0) return
    try {
      const sourceContent = getSourceContent?.()
      const viewIds = viewModels.map(vm => vm.$view.id)
      const optionsByViewId = buildDrawioExportOptionsForViews(viewIds, sourceContent)
      const xml = generateDrawioMulti(viewModels, optionsByViewId)
      downloadDrawioBlob(xml, DEFAULT_DRAWIO_ALL_FILENAME)
    } catch (err) {
      reportExportError('DrawIO export all views failed', err, onExportError)
    }
  }, [
    close,
    allViewModelsFromState,
    getSourceContent,
    getLayoutedModel,
    layoutViews,
    likec4model,
    viewStates,
    onExportError,
  ])

  const canExportAllViews = allViewModelsFromState.length > 0 || (!!getLayoutedModel && !!likec4model)

  return {
    openMenu,
    handleExport,
    handleExportAllViews,
    menuPosition,
    opened,
    close,
    canExport: diagram != null,
    canExportAllViews,
  }
}
