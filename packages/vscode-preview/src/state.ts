import { nonNullable } from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import type {
  DiagramNode,
  LayoutType,
  ProjectId,
  scalar,
} from '@likec4/core/types'
import type { LikeC4EditorPort } from '@likec4/diagram'
import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { atom, batched, onSet } from 'nanostores'
import { useEffect, useMemo, useRef } from 'react'
import { queries, queryClient } from './queries'
import { ExtensionApi, getVscodeState, saveVscodeState } from './vscode'

const vscodeState = getVscodeState()

const $layoutType = atom('manual' as LayoutType)
export function setLayoutType(layoutType: LayoutType) {
  $layoutType.set(layoutType)
}

const $screen = atom(vscodeState.screen)
onSet($screen, (screen) => {
  saveVscodeState({ screen: screen.newValue })
})

export function useScreen() {
  return useStore($screen)
}
export function openProjectsScreen() {
  ExtensionApi.navigateToProjectsOverview()
  $screen.set('projects')
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
    queries.fetchComputedModel(vscodeState.model.projectId as ProjectId).queryKey,
    vscodeState.model,
    {
      updatedAt: vscodeState.updatedAt,
    },
  )
  if (vscodeState.view) {
    queryClient.setQueryData(
      queries.fetchDiagramView(
        vscodeState.model.projectId as ProjectId,
        vscodeState.view.id,
        vscodeState.view._layout ?? 'manual',
      )
        .queryKey,
      vscodeState.view,
      {
        updatedAt: vscodeState.updatedAt,
      },
    )
  }
}
if (vscodeState.projectsOverview) {
  queryClient.setQueryData(
    queries.projectsOverview.queryKey,
    vscodeState.projectsOverview,
    {
      updatedAt: vscodeState.updatedAt,
    },
  )
}

// type VscodeAppState = Omit<VscodeState, 'viewId' | 'projectId' | 'layouted'>
// const $appstate = atom({
//   nodesDraggable: vscodeState.nodesDraggable,
//   edgesEditable: vscodeState.edgesEditable,
// })

// const setVscodeAppstate = (state: Partial<VscodeAppState>) => {
//   const currentstate = $appstate.get()
//   const nextstate = {
//     ...currentstate,
//     ...state,
//   }
//   if (!isDeepEqual(nextstate, currentstate)) {
//     $appstate.set(nextstate)
//   }
//   saveVscodeState(nextstate)
// }

// export const useVscodeAppState = () => {
//   const value = useStore($appstate)
//   return [
//     value,
//     setVscodeAppstate,
//   ] as const
// }

export function changeViewId(viewId: scalar.ViewId, projectId?: scalar.ProjectId) {
  $screen.set('view')
  if (projectId) {
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

ExtensionApi.onOpenViewNotification((next) => {
  if (next.screen === 'projects') {
    void queryClient.invalidateQueries()
    $screen.set('projects')
    return
  }
  if ($screen.get() !== 'view') {
    $screen.set('view')
  }
  changeViewId(next.viewId, next.projectId)
})

ExtensionApi.onGetLastClickedNodeRequest(() => {
  const node = $lastClickedNode.get()
  return {
    element: node?.modelRef ?? null,
    deployment: node?.deploymentRef ?? null,
  }
})

ExtensionApi.onModelUpdateNotification(async () => {
  // Invalidate inactive queries,
  // so they will be refetched when accessed next time
  await queryClient.invalidateQueries({
    type: 'inactive',
    refetchType: 'none',
    queryKey: [$projectId.get()],
  })
  // First refetch active model
  await queryClient.refetchQueries({
    queryKey: [$projectId.get(), 'model'],
    type: 'active',
  })
  // Then refetch active diagram views
  await queryClient.refetchQueries({
    type: 'active',
    queryKey: [$projectId.get(), 'diagram'],
  })
})

ExtensionApi.onProjectsUpdateNotification(() => {
  void queryClient.invalidateQueries({
    queryKey: queries.projectsOverview.queryKey,
  })
})

const projectAndView = batched(
  [$projectId, $viewId, $layoutType],
  (projectId, viewId, layoutType) => ({ projectId, viewId, layoutType }),
)

export function useComputedModel() {
  const { projectId } = useStore(projectAndView)
  const { data: model, error, refetch } = useQuery(
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
    reset: async () => {
      await refetch({
        cancelRefetch: true,
        throwOnError: false,
      })
    },
  }
}

export function useDiagramView() {
  const { projectId, viewId, layoutType } = useStore(projectAndView)
  const { data: view, error, refetch } = useQuery(
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

  const title = view?.title ?? viewRef.current?.title ?? viewId

  useEffect(() => {
    ExtensionApi.updateTitle(title)
  }, [title])

  return {
    projectId,
    viewId,
    layoutType,
    view: viewRef.current,
    error,
    reset: async () => {
      await refetch({
        cancelRefetch: true,
        throwOnError: false,
      })
    },
  }
}

const editorPort: LikeC4EditorPort = {
  fetchView: async (viewId, layout) => {
    const view = await queryClient.fetchQuery(queries.fetchDiagramView($projectId.get(), viewId, layout))
    return nonNullable(view, `View ${viewId} not found`)
  },
  handleChange: async (viewId, change) => {
    await ExtensionApi.change({
      projectId: $projectId.get(),
      viewId,
      change,
    })
  },
}

export function useLikeC4EditorPort() {
  return editorPort
}
