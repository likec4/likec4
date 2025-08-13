import { LikeC4Model } from '@likec4/core/model'
import {
  type ComputedLikeC4ModelData,
  type ComputedView,
  type DiagramNode,
  type DiagramView,
  type scalar,
  type ViewId,
} from '@likec4/core/types'
import { shallowEqual } from '@mantine/hooks'
import { useStore } from '@nanostores/react'
import { atom, batched, computed, map as mapStore, onMount, task } from 'nanostores'
import { useRef } from 'react'
import { entries, isDeepEqual, prop, values } from 'remeda'
import { BroadcastModelUpdate, GetLastClickedNode, OnOpenView } from '../protocol'
import { type VscodeState, ExtensionApi, getVscodeState, messenger, saveVscodeState } from './vscode'

const vscodeState = getVscodeState()

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
export const $projectId = atom(vscodeState.projectId)

export const changeViewId = (viewId: scalar.ViewId, projectId?: scalar.ProjectId) => {
  projectId = projectId ?? $projectId.get()
  if ($projectId.get() !== projectId) {
    $projectId.set(projectId)
    $initialized.set(false)
    $likeC4Diagrams.set({
      [viewId]: {
        state: 'pending',
        view: null,
        error: null,
      },
    })
    $viewId.set(viewId)
    fetchComputedModel().finally(() => {
      $initialized.set(true)
    })
    saveVscodeState({ viewId, projectId })
    return
  }

  const diagramState = $likeC4Diagrams.get()[viewId]
  if (!diagramState) {
    $likeC4Diagrams.setKey(viewId, {
      state: 'pending',
      view: null,
      error: null,
    })
  } else {
    $likeC4Diagrams.setKey(viewId, {
      ...diagramState,
      state: 'stale',
    })
  }
  $viewId.set(viewId)
  saveVscodeState({ viewId, projectId })
}

messenger.onNotification(OnOpenView, ({ viewId, projectId }) => {
  changeViewId(viewId, projectId)
})

export type ViewState = {
  state: 'pending'
  view: null
  error: null
} | {
  state: 'success'
  view: DiagramView
  error: null
} | {
  state: 'error'
  view: DiagramView | null
  error: string
} | {
  state: 'stale'
  view: DiagramView | null
  error: string | null
}

export type LikeC4DiagramsAtom = Record<ViewId, ViewState>

const { view } = getVscodeState()
export const $likeC4Diagrams = mapStore<LikeC4DiagramsAtom>({
  [vscodeState.viewId]: view
    ? {
      state: 'stale',
      view,
      error: null,
    }
    : {
      state: 'pending',
      view: null,
      error: null,
    },
})

const $computedData = atom<ComputedLikeC4ModelData>(LikeC4Model.EMPTY.$data)

function updateLikeC4ModelSource(next: ComputedLikeC4ModelData) {
  if (isDeepEqual($computedData.get(), next)) {
    return
  }
  const currentViews = $computedData.get().views
  $computedData.set(next)

  const likeC4Diagrams = $likeC4Diagrams.get()

  for (const view of values(next.views)) {
    if (!isDeepEqual(currentViews[view.id], view)) {
      const likeC4Diagram = likeC4Diagrams[view.id]
      if (likeC4Diagram) {
        $likeC4Diagrams.setKey(view.id, {
          ...likeC4Diagram,
          state: 'stale',
        })
      } else {
        $likeC4Diagrams.setKey(view.id, {
          state: 'pending',
          view: null,
          error: null,
        })
      }
    }
  }

  // Mark views as not found
  for (const [key, likeC4Diagram] of entries(likeC4Diagrams)) {
    if (!(key in next.views)) {
      $likeC4Diagrams.setKey(key as ViewId, {
        ...likeC4Diagram,
        error: 'View is not found',
        state: 'error',
      })
    }
  }
}

async function fetchComputedModel() {
  try {
    const { model } = await ExtensionApi.fetchComputedModel()
    if (model) {
      updateLikeC4ModelSource(model)
    }
    return model
  } catch (e: any) {
    console.error(`[Messenger] onChange error`, { error: e })
    $modelerror.set(e.message)
    return null
  }
}
messenger.onNotification(BroadcastModelUpdate, () => {
  fetchComputedModel()
})
/**
 * If model was loaded
 */
const $initialized = atom(false)
onMount($initialized, () => {
  task(async () => {
    await fetchComputedModel()
    $initialized.set(true)
  })
})

export const useIsModelLoaded = () => useStore($initialized)

const $viewstate = atom<ViewState>({
  state: 'error',
  view: null,
  error: 'View is not loaded',
})
const $current = computed([$viewId, $likeC4Diagrams], (viewId, diagrams) => diagrams[viewId] ?? null)
const $view = computed($viewstate, prop('view'))
const $state = computed($viewstate, prop('state'))

const $likec4model = atom(LikeC4Model.EMPTY)
const $modelerror = atom<string | null>(null)

onMount($viewstate, () => {
  const subscribers = [
    $current.subscribe((next, prev) => {
      if (next && !shallowEqual(next, prev)) {
        $viewstate.set(next)
      }
    }),
    // Update vscode state on view change
    $view.listen((view) => {
      if (view) {
        saveVscodeState({
          viewId: view.id,
          view,
        })
      }
    }),
    // Initialize load
    $state.subscribe((next, prev) => {
      if (next !== prev && (next === 'pending' || next === 'stale')) {
        fetchDiagramView($viewId.get()).catch(e => console.error(e))
      }
    }),
    computed([$view, $computedData], (view, data) => ({ view, data })).subscribe((next, prev) => {
      if (next.view && !shallowEqual(next, prev)) {
        try {
          $likec4model.set(LikeC4Model.create({
            ...next.data,
            views: {
              ...next.data.views,
              [next.view.id]: next.view as unknown as ComputedView,
            },
          }))
          $modelerror.set(null)
        } catch (e: any) {
          console.error('Error creating LikeC4Model', e)
          $modelerror.set(e.message)
        }
      }
    }),
  ]

  return () => subscribers.forEach(off => off())
})

async function fetchDiagramView(viewId: ViewId) {
  try {
    const {
      error,
      view,
    } = await ExtensionApi.fetchDiagramView(viewId)
    const currentView = $likeC4Diagrams.get()[viewId]?.view ?? null
    if (error) {
      $likeC4Diagrams.setKey(viewId, {
        state: 'error',
        view: view || currentView,
        error,
      })
      return
    }
    if (!view) {
      $likeC4Diagrams.setKey(viewId, {
        state: 'error',
        view: currentView,
        error: `Invalid response without view`,
      })
      return
    }

    $likeC4Diagrams.setKey(viewId, {
      state: 'success',
      view: currentView && isDeepEqual(view, currentView) ? currentView : view,
      error: null,
    })
  } catch (e: any) {
    $likeC4Diagrams.setKey(viewId, {
      state: 'error',
      view: $likeC4Diagrams.get()[viewId]?.view ?? null,
      error: e.message,
    })
  }
}

export function refetchCurrentDiagram() {
  const viewId = $viewId.get()
  const view = $likeC4Diagrams.get()[viewId]?.view ?? null

  $likeC4Diagrams.setKey(
    viewId,
    view
      ? {
        state: 'stale',
        view,
        error: null,
      }
      : {
        state: 'pending',
        view: null,
        error: null,
      },
  )
}

const all = batched([$viewstate, $modelerror, $likec4model], (viewstate, modelerror, likec4model) => ({
  viewstate,
  modelerror,
  likec4model,
}))
export function useLikeC4State() {
  const {
    viewstate: {
      view,
      state,
      error,
    },
    modelerror,
    likec4model,
  } = useStore(all)
  const prevViewRef = useRef(view)
  // if view is not null - save it as previous
  if (view) {
    prevViewRef.current = view
  }

  return {
    state,
    error: error ?? modelerror,
    likec4model,
    view: view ?? prevViewRef.current,
  }
}

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
