import { nonNullable } from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import type {
  DiagramNode,
  LayoutType,
  scalar,
} from '@likec4/core/types'
import type { LikeC4EditorPort } from '@likec4/diagram'
import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { atom, batched } from 'nanostores'
import { useEffect, useMemo, useRef } from 'react'
import { isDeepEqual } from 'remeda'
import { queries, queryClient } from './queries'
import { type VscodeState, ExtensionApi, getVscodeState, saveVscodeState } from './vscode'

const vscodeState = getVscodeState()

const $layoutType = atom('manual' as LayoutType)
export function setLayoutType(layoutType: LayoutType) {
  $layoutType.set(layoutType)
}

/**
 * Current view id
 */
export const $viewId = atom(vscodeState.viewId)
export function useViewId() {
  return useStore($viewId)
}

export const $projectId = atom(vscodeState.projectId)
export function useProjectId() {
  return useStore($projectId)
}

if (vscodeState.model) {
  queryClient.setQueryData(
    queries.fetchComputedModel(vscodeState.model.projectId).queryKey,
    vscodeState.model,
    {
      updatedAt: vscodeState.updatedAt,
    },
  )
  if (vscodeState.view) {
    queryClient.setQueryData(
      queries.fetchDiagramView(vscodeState.model.projectId, vscodeState.viewId, vscodeState.view._layout ?? 'manual')
        .queryKey,
      vscodeState.view,
      {
        updatedAt: vscodeState.updatedAt,
      },
    )
  }
}

type VscodeAppState = Omit<VscodeState, 'viewId' | 'projectId' | 'layouted'>
const $appstate = atom({
  nodesDraggable: vscodeState.nodesDraggable,
  edgesEditable: vscodeState.edgesEditable,
})

const setVscodeAppstate = (state: Partial<VscodeAppState>) => {
  const nextstate = {
    ...$appstate.get(),
    ...state,
  }
  if (!isDeepEqual(nextstate, $appstate.get())) {
    $appstate.set(nextstate)
  }
  saveVscodeState(nextstate)
}

export const useVscodeAppState = () => {
  const value = useStore($appstate)
  return [
    value,
    setVscodeAppstate,
  ] as const
}

export const changeViewId = (viewId: scalar.ViewId, projectId?: scalar.ProjectId) => {
  projectId = projectId ?? $projectId.get()
  saveVscodeState({ viewId, projectId })
  if ($projectId.get() !== projectId) {
    $projectId.set(projectId)
  }
  if ($viewId.get() !== viewId) {
    $layoutType.set('manual')
    $viewId.set(viewId)
  }
}

const $lastClickedNode = atom<DiagramNode | null>(null)

export const setLastClickedNode = (node?: DiagramNode) => {
  $lastClickedNode.set(node ?? null)
}

ExtensionApi.onOpenViewNotification(({ viewId, projectId }) => {
  changeViewId(viewId, projectId)
})

ExtensionApi.onGetLastClickedNodeRequest(() => {
  const node = $lastClickedNode.get()
  return {
    element: node?.modelRef ?? null,
    deployment: node?.deploymentRef ?? null,
  }
})

ExtensionApi.onModelUpdateNotification(async () => {
  // Then fetch fresh data
  await queryClient.refetchQueries({
    queryKey: queries.fetchComputedModel($projectId.get()).queryKey,
    stale: true,
    type: 'active',
  })
  // Invalidate inactive diagram views,
  // so they will be refetched when accessed next time
  await queryClient.invalidateQueries({
    type: 'inactive',
    refetchType: 'none',
    queryKey: [$projectId.get(), 'diagram'],
  })
  // Refetch active diagram views
  await queryClient.refetchQueries({
    type: 'active',
    stale: true,
    queryKey: [$projectId.get(), 'diagram'],
  })
})

const projectAndView = batched(
  [$projectId, $viewId, $layoutType],
  (projectId, viewId, layoutType) => ({ projectId, viewId, layoutType }),
)

export function useComputedModel() {
  const { projectId } = useStore(projectAndView)
  const { data: model, error } = useQuery(
    queries.fetchComputedModel(projectId),
  )

  useEffect(() => {
    if (!model) {
      return
    }
    saveVscodeState({ projectId: model.project.id, model })
  }, [model])

  const likec4model = useMemo(() => {
    return model ? LikeC4Model.create(model) : null
  }, [model])

  const likec4modelref = useRef(likec4model)
  // Always keep last known model in ref
  if (likec4model) {
    likec4modelref.current = likec4model
  }

  return {
    model,
    error,
    likec4Model: likec4modelref.current,
  }
}

export function useDiagramView() {
  const { projectId, viewId, layoutType } = useStore(projectAndView)
  const { data: view, error } = useQuery(
    queries.fetchDiagramView(projectId, viewId, layoutType),
  )

  const viewRef = useRef(view)
  // Always keep last known view in ref
  if (view) {
    viewRef.current = view
  }

  useEffect(() => {
    if (!view) {
      return
    }
    saveVscodeState({ viewId: view.id, view })
  }, [view])

  return {
    view: viewRef.current,
    error,
  }
}

export function useLikeC4EditorPort(): LikeC4EditorPort {
  return useMemo(() => ({
    fetchView: async (viewId, layout) => {
      const view = await queryClient.fetchQuery(queries.fetchDiagramView($projectId.get(), viewId, layout))
      return nonNullable(view, `View ${viewId} not found`)
    },
    handleChange: async (viewId, change) => {
      await ExtensionApi.change(viewId, change)
    },
  }), [])
}
