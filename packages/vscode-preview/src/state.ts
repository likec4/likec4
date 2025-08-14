import { LikeC4Model } from '@likec4/core/model'
import {
  type DiagramNode,
  type scalar,
} from '@likec4/core/types'
import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { atom, batched } from 'nanostores'
import { useEffect, useRef } from 'react'
import { isDeepEqual } from 'remeda'
import { BroadcastModelUpdate, GetLastClickedNode, OnOpenView } from '../protocol'
import { queries, queryClient } from './queries'
import { type VscodeState, getVscodeState, messenger, saveVscodeState } from './vscode'

const vscodeState = getVscodeState()

if (vscodeState.model) {
  queryClient.setQueryData(
    queries.fetchComputedModel(vscodeState.model.projectId).queryKey,
    vscodeState.model,
    {
      updatedAt: vscodeState.updatedAt,
    },
  )
}
if (vscodeState.view) {
  queryClient.setQueryData(
    queries.fetchDiagramView(vscodeState.projectId, vscodeState.viewId).queryKey,
    vscodeState.view,
    {
      updatedAt: vscodeState.updatedAt,
    },
  )
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

export const changeViewId = (viewId: scalar.ViewId, projectId?: scalar.ProjectId) => {
  projectId = projectId ?? $projectId.get()
  saveVscodeState({ viewId, projectId })
  if ($projectId.get() !== projectId) {
    $projectId.set(projectId)
  }
  $viewId.set(viewId)
}

messenger.onNotification(OnOpenView, ({ viewId, projectId }) => {
  changeViewId(viewId, projectId)
})

const $lastClickedNode = atom<DiagramNode | null>(null)

export const setLastClickedNode = (node?: DiagramNode) => {
  $lastClickedNode.set(node ?? null)
}

messenger.onRequest(GetLastClickedNode, () => {
  const node = $lastClickedNode.get()
  return {
    element: node?.modelRef ?? null,
    deployment: node?.deploymentRef ?? null,
  }
})

messenger.onNotification(BroadcastModelUpdate, () => {
  queryClient.invalidateQueries({
    queryKey: [$projectId.get()],
  })
})

const projectAndView = batched([$projectId, $viewId], (projectId, viewId) => ({ projectId, viewId }))

export function useComputedModel() {
  const { projectId } = useStore(projectAndView)
  const { data: model, error, isFetching } = useQuery({
    ...queries.fetchComputedModel(projectId),
  })

  useEffect(() => {
    if (!model) {
      return
    }
    saveVscodeState({ projectId: model.project.id, model })
  }, [model])

  const likec4Model = useRef<LikeC4Model | null>(null)
  if (model) {
    likec4Model.current = LikeC4Model.create(model)
  }

  return {
    model,
    error,
    likec4Model: likec4Model.current,
    isFetching,
  }
}

export function useDiagramView() {
  const { projectId, viewId } = useStore(projectAndView)
  const {
    data: view,
    error,
    isFetching,
  } = useQuery({
    ...queries.fetchDiagramView(projectId, viewId),
  })

  const prevView = useRef(view)
  if (view) {
    prevView.current = view
  }

  useEffect(() => {
    if (!view) {
      return
    }
    saveVscodeState({ viewId, view })
  }, [view])

  return {
    view: view ?? prevView.current,
    error,
    isFetching,
  }
}
