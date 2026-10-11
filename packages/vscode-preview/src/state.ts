import { nonNullable } from '@likec4/core'
import type {
  ComputedLikeC4ModelData,
  DiagramNode,
  LayoutType,
  ProjectId,
  scalar,
} from '@likec4/core/types'
import type { LikeC4EditorCallbacks } from '@likec4/diagram'
import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { atom, batched, onSet } from 'nanostores'
import { useCallback, useEffect } from 'react'
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

const $showSpinner = atom(false)
export function useShowSpinner() {
  return useStore($showSpinner)
}

ExtensionApi.onAiLayoutUpdateNotification((params) => {
  $showSpinner.set(params.state === 'in-progress')
})

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
  const projectId = $projectId.get()
  const viewId = $viewId.get()
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: queries.fetchComputedModel(projectId).queryKey,
      refetchType: 'active',
    }),
    // Remove queries of other views
    Promise.resolve().then(() =>
      queryClient.removeQueries({
        predicate({ isActive, queryKey }) {
          return !isActive && queryKey.at(0) === projectId && queryKey.at(1) === 'diagram' && queryKey.at(2) !== viewId
        },
      })
    ),
    // And refetch active diagram views
    queryClient.invalidateQueries({
      queryKey: [projectId, 'diagram', viewId],
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: queries.projectsOverview.queryKey,
      refetchType: 'active',
    }),
  ])
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

export function useComputedModelData() {
  const projectId = useStore($projectId)
  const { data: model, error, refetch } = useQuery(
    queries.fetchComputedModel(projectId),
  )

  useEffect(() => {
    if (!model) {
      return
    }
    saveVscodeState({ projectId: model.project.id, model })
  }, [model])

  return {
    projectId,
    model,
    error,
    refetch,
  }
}

export function useDiagramView(projectId: ProjectId) {
  const { projectId: storedProjectId, viewId, layoutType } = useStore(projectAndView)
  const { data: hash, isPlaceholderData } = useQuery({
    ...queries.fetchComputedModel(projectId),
    select: useCallback((d: ComputedLikeC4ModelData) => {
      return d.views[viewId]?.hash ?? null
    }, [viewId]),
  })

  const { data: view, error } = useQuery({
    ...queries.fetchDiagramView(projectId, viewId, layoutType, hash),
    enabled: hash !== undefined && !isPlaceholderData && projectId === storedProjectId,
  })

  useEffect(() => {
    if (!view) {
      return
    }
    saveVscodeState({ viewId: view.id, view })
  }, [view])

  // const resolved = view ?? prev.current
  const title = view?.title ?? viewId

  useEffect(() => {
    ExtensionApi.updateTitle(title)
  }, [title])

  return {
    projectId,
    viewId: view?.id ?? viewId,
    layoutType: view?._layout ?? layoutType,
    view,
    error,
  }
}

const editorPort: LikeC4EditorCallbacks = {
  fetchView: async (viewId, layout) => {
    const view = await queryClient.fetchQuery({
      ...queries.fetchDiagramView($projectId.get(), viewId, layout),
      staleTime: 0,
    })
    return nonNullable(view, `View ${viewId} not found`)
  },
  handleChange: async (viewId, change) => {
    await ExtensionApi.change({
      projectId: $projectId.get(),
      viewId,
      change,
    })
  },
  ...__HAS_AI && {
    applySemanticLayout: async (viewId) => {
      ExtensionApi.applySemanticLayout(viewId)
    },
  },
}

export function useLikeC4EditorPort() {
  return editorPort
}
