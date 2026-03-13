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
import { useCallback, useEffect, useRef } from 'react'
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
    queryClient.removeQueries({
      predicate({ isActive, queryKey }) {
        return !isActive && queryKey.at(0) === projectId && queryKey.at(1) === 'diagram' && queryKey.at(2) !== viewId
      },
    }),
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
  const query = useQuery(
    queries.fetchComputedModel(projectId),
  )
  const model = query.data
  const error = query.error

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
  }
}

export function useDiagramView(projectId: ProjectId) {
  const { projectId: storedProjectId, viewId, layoutType } = useStore(projectAndView)
  const modelQ = useQuery({
    ...queries.fetchComputedModel(projectId),
    select: useCallback((d: ComputedLikeC4ModelData) => {
      return d.views[viewId]?.hash ?? viewId
    }, [viewId]),
  })
  const hash = modelQ.data ?? viewId
  const isFetching = modelQ.isFetching
  const viewQ = useQuery({
    ...queries.fetchDiagramView(projectId, viewId, layoutType, hash),
    enabled: !isFetching && projectId === storedProjectId,
  })

  const view = viewQ.data
  const prev = useRef(view)
  const error = viewQ.error

  useEffect(() => {
    if (!view) {
      return
    }
    prev.current = view
    saveVscodeState({ viewId: view.id, view })
  }, [view])

  const resolved = view ?? prev.current
  const title = resolved?.title ?? viewId

  useEffect(() => {
    ExtensionApi.updateTitle(title)
  }, [title])

  return {
    projectId,
    viewId: resolved?.id ?? viewId,
    layoutType: resolved?._layout ?? layoutType,
    view: resolved,
    error,
  }
}

const editorPort: LikeC4EditorCallbacks = {
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
