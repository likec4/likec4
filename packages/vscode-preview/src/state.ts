import type {
  DiagramNode,
  LayoutType,
  ProjectId,
  scalar,
  UnknownComputed,
} from '@likec4/core/types'
import { nonNullable, stringHash } from '@likec4/core/utils'
import { type LikeC4EditorCallbacks, useLikeC4Model, useUpdateEffect } from '@likec4/diagram'
import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { atom, batched, onSet } from 'nanostores'
import { useEffect } from 'react'
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
  if (vscodeState.view && vscodeState.viewQueryKey) {
    queryClient.setQueryData(
      vscodeState.viewQueryKey,
      vscodeState.view,
      { updatedAt: vscodeState.updatedAt },
    )
  }
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
    queryClient.invalidateQueries({
      queryKey: queries.projectsOverview.queryKey,
      refetchType: 'active',
    }),
    // // Remove queries of other views
    // Promise.resolve().then(() =>
    //   queryClient.removeQueries({
    //     predicate({ isActive, queryKey }) {
    //       return !isActive && queryKey[0] === 'project' && queryKey[1] === projectId && queryKey[2] === 'diagram' &&
    //         queryKey[3] !== viewId
    //     },
    //   })
    // ),
    // And refetch active diagram views
    queryClient.invalidateQueries({
      queryKey: ['project', projectId, 'diagram'],
    }),
  ])
})

ExtensionApi.onProjectsUpdateNotification(() => {
  void queryClient.invalidateQueries({
    refetchType: 'active',
  })
})

const projectAndView = batched(
  [$projectId, $viewId, $layoutType],
  (projectId, viewId, layoutType) => ({ projectId, viewId, layoutType }),
)

export function useComputedModelData() {
  const projectId = useStore($projectId)
  const { data: model, error, refetch, isPlaceholderData, isPending } = useQuery(
    queries.fetchComputedModel(projectId),
  )

  useEffect(() => {
    if (!model || isPlaceholderData) {
      return
    }
    saveVscodeState({ projectId: model.projectId, model })
  }, [model, isPlaceholderData])

  return {
    projectId,
    model,
    error,
    refetch,
    isPlaceholderData,
    isPending,
  }
}

export function useDiagramView() {
  const { projectId: storedProjectId, viewId, layoutType } = useStore(projectAndView)

  const likec4Model = useLikeC4Model<UnknownComputed>()
  const modelProjectId = likec4Model.projectId
  const viewModel = likec4Model.findView(viewId)
  const viewHash = viewModel?.$view.hash

  const hash = viewHash ? stringHash(`${viewHash}:${likec4Model.$styles.fingerprint}`) : undefined

  const queryOptions = queries.fetchDiagramView(modelProjectId, viewId, layoutType, hash)

  const {
    data: view,
    error,
    isPlaceholderData,
    isPending,
  } = useQuery({
    ...queryOptions,
    enabled: modelProjectId === storedProjectId,
  })

  useUpdateEffect(() => {
    if (!view || isPlaceholderData) {
      return
    }
    saveVscodeState({
      viewId: view.id,
      viewQueryKey: queryOptions.queryKey,
      view,
    })
  }, [view, queryOptions.queryKey, isPlaceholderData])

  const title = viewModel?.titleOrId

  useEffect(() => {
    if (title) {
      ExtensionApi.updateTitle(title)
    }
  }, [title])

  return {
    projectId: modelProjectId,
    viewId: view?.id ?? viewId,
    layoutType: view?._layout ?? layoutType,
    view,
    error,
    isPending,
    isPlaceholderData,
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
