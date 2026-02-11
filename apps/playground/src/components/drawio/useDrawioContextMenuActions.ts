import type { LayoutedLikeC4ModelData } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import {
  generateDrawio,
  generateDrawioMulti,
  parseDrawioRoundtripComments,
  parseDrawioToLikeC4,
} from '@likec4/generators'
import type { GenerateDrawioOptions } from '@likec4/generators'
import { useDisclosure } from '@mantine/hooks'
import { useCallback, useMemo, useRef, useState } from 'react'

const DRAWIO_ACCEPT = '.drawio,.drawio.xml,application/x-drawio'

export type DiagramStateLike = {
  state: string
  diagram?: DiagramView | null
}

export type UseDrawioContextMenuActionsParams = {
  diagram: DiagramView | null
  likec4model: LikeC4Model | null
  viewStates?: Record<string, DiagramStateLike>
  onAddFile: (filename: string, content: string) => void
  /** Optional: .c4 source content to parse round-trip comment blocks for re-export (layout, strokes, waypoints). */
  getSourceContent?: () => string | undefined
  /** Optional: fetch full layouted model from LSP so "Export all views" includes every view as a tab. */
  getLayoutedModel?: () => Promise<LayoutedLikeC4ModelData | null>
  /** Optional: layout each view by id and return diagrams (fallback when getLayoutedModel returns fewer views). */
  layoutViews?: (viewIds: string[]) => Promise<Record<string, DiagramView>>
}

export function useDrawioContextMenuActions({
  diagram,
  likec4model,
  viewStates = {},
  onAddFile,
  getSourceContent,
  getLayoutedModel,
  layoutViews,
}: UseDrawioContextMenuActionsParams) {
  const allViewModelsFromState = useMemo(() => {
    if (!likec4model) return []
    const list: Array<{ $view: DiagramView; get $styles(): LikeC4Model['$styles'] }> = []
    const styles = likec4model.$styles
    for (const vs of Object.values(viewStates)) {
      if (vs?.state === 'success' && vs.diagram) {
        list.push({
          $view: vs.diagram,
          get $styles() {
            return styles ?? null
          },
        })
      }
    }
    return list
  }, [likec4model, viewStates])
  const [opened, { open, close }] = useDisclosure(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
    setMenuPosition({ x: event.clientX, y: event.clientY })
    open()
  }, [open])

  const handleImport = useCallback(() => {
    close()
    fileInputRef.current?.click()
  }, [close])

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      const reader = new FileReader()
      reader.onload = () => {
        const xml = reader.result as string
        try {
          const likec4Source = parseDrawioToLikeC4(xml)
          const base = file.name.replace(/\.drawio(\.xml)?$/i, '')
          const filename = `${base}.c4`
          onAddFile(filename, likec4Source)
        } catch (err) {
          console.error('DrawIO import failed', err)
        }
      }
      reader.readAsText(file, 'utf-8')
    },
    [onAddFile],
  )

  const handleExport = useCallback(() => {
    close()
    if (!diagram) return
    try {
      const viewmodel = {
        $view: diagram,
        get $styles() {
          return likec4model?.$styles ?? null
        },
      }
      let options: Parameters<typeof generateDrawio>[1] | undefined
      const sourceContent = getSourceContent?.()
      if (sourceContent) {
        const roundtrip = parseDrawioRoundtripComments(sourceContent)
        if (roundtrip) {
          const layoutForView = roundtrip.layoutByView[diagram.id]?.nodes
          options = { compressed: false }
          if (layoutForView != null) options.layoutOverride = layoutForView
          if (Object.keys(roundtrip.strokeColorByFqn).length > 0) {
            options.strokeColorByNodeId = roundtrip.strokeColorByFqn
          }
          if (Object.keys(roundtrip.strokeWidthByFqn).length > 0) {
            options.strokeWidthByNodeId = roundtrip.strokeWidthByFqn
          }
          if (Object.keys(roundtrip.edgeWaypoints).length > 0) {
            options.edgeWaypoints = roundtrip.edgeWaypoints
          }
        }
      }
      if (options) options.compressed = false
      else options = { compressed: false }
      const xml = generateDrawio(
        viewmodel as Parameters<typeof generateDrawio>[0],
        options,
      )
      const blob = new Blob([xml], { type: 'application/x-drawio' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${diagram.id}.drawio`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('DrawIO export failed', err)
    }
  }, [close, diagram, likec4model, getSourceContent])

  const handleExportAllViews = useCallback(async () => {
    close()
    type ViewModel = { $view: DiagramView; get $styles(): LikeC4Model['$styles'] | null }
    if (!likec4model) return
    const viewIdsInModel = [...likec4model.views()].map(vm => vm.$view.id)
    if (viewIdsInModel.length === 0) return
    const styles = likec4model.$styles
    const byId = new Map<string, ViewModel>()
    allViewModelsFromState.forEach(vm => byId.set(vm.$view.id, vm))
    if (getLayoutedModel) {
      try {
        const model = await getLayoutedModel()
        if (model?.views && typeof model.views === 'object') {
          for (const view of Object.values(model.views)) {
            byId.set(view.id, {
              $view: view,
              get $styles() {
                return styles ?? null
              },
            })
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
          byId.set(viewId, {
            $view: state.diagram,
            get $styles() {
              return styles ?? null
            },
          })
        }
      }
    }
    const missing = viewIdsInModel.filter(id => !byId.has(id))
    if (missing.length > 0 && layoutViews) {
      try {
        const diagrams = await layoutViews(missing)
        for (const viewId of missing) {
          const diagram = diagrams[viewId]
          if (diagram) {
            byId.set(viewId, {
              $view: diagram,
              get $styles() {
                return styles ?? null
              },
            })
          }
        }
      } catch (e) {
        console.error('DrawIO export: layoutViews failed', e)
      }
    }
    const viewModels = viewIdsInModel.map(id => byId.get(id)).filter(Boolean) as ViewModel[]
    if (viewModels.length === 0) return
    try {
      let optionsByViewId: Record<string, GenerateDrawioOptions> | undefined
      const sourceContent = getSourceContent?.()
      if (sourceContent) {
        const roundtrip = parseDrawioRoundtripComments(sourceContent)
        if (roundtrip) {
          optionsByViewId = {}
          for (const vm of viewModels) {
            const view = vm.$view
            const opts: GenerateDrawioOptions = { compressed: false }
            const layoutForView = roundtrip.layoutByView[view.id]?.nodes
            if (layoutForView != null) opts.layoutOverride = layoutForView
            if (Object.keys(roundtrip.strokeColorByFqn).length > 0) {
              opts.strokeColorByNodeId = roundtrip.strokeColorByFqn
            }
            if (Object.keys(roundtrip.strokeWidthByFqn).length > 0) {
              opts.strokeWidthByNodeId = roundtrip.strokeWidthByFqn
            }
            if (Object.keys(roundtrip.edgeWaypoints).length > 0) opts.edgeWaypoints = roundtrip.edgeWaypoints
            optionsByViewId[view.id] = opts
          }
        }
      }
      if (!optionsByViewId) {
        optionsByViewId = {}
        for (const vm of viewModels) optionsByViewId[vm.$view.id] = { compressed: false }
      }
      const xml = generateDrawioMulti(
        viewModels as Parameters<typeof generateDrawioMulti>[0],
        optionsByViewId,
      )
      const blob = new Blob([xml], { type: 'application/x-drawio' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'diagrams.drawio'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('DrawIO export all views failed', err)
    }
  }, [close, allViewModelsFromState, getSourceContent, getLayoutedModel, layoutViews, likec4model, viewStates])

  return {
    openMenu,
    handleImport,
    handleExport,
    handleExportAllViews,
    handleImportFile,
    fileInputRef,
    menuPosition,
    opened,
    close,
    canExport: diagram != null,
    canExportAllViews: allViewModelsFromState.length > 0 || (!!getLayoutedModel && !!likec4model),
  }
}

export { DRAWIO_ACCEPT }
