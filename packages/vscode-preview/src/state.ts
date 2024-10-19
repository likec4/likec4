import { type ComputedLikeC4Model, type DiagramNode, type DiagramView, LikeC4Model, type ViewID } from '@likec4/core'
import { useStore } from '@nanostores/react'
import { atom, batched, deepMap, map, onMount, onSet, task } from 'nanostores'
import { useRef } from 'react'
import { entries, isDeepEqual, isNullish, keys, values } from 'remeda'
import { BroadcastModelUpdate, GetLastClickedNode, OnOpenView } from '../protocol'
import { ExtensionApi, getVscodeState, messenger, saveVscodeState, type VscodeState } from './vscode'

const {
  viewId,
  view,
  ...appstate
} = getVscodeState()

type VscodeAppState = Omit<VscodeState, 'viewId' | 'view'>
const $appstate = atom(appstate)

const setVscodeAppstate = (state: Partial<VscodeAppState>) => {
  const nextstate = {
    ...$appstate.get(),
    ...state
  }
  $appstate.set(nextstate)
  saveVscodeState(nextstate)
}

export const useVscodeAppState = () => {
  const value = useStore($appstate)
  return [
    value,
    setVscodeAppstate
  ] as const
}

/**
 * If model was loaded
 */
export const $initialized = atom(!!view)

export const useIsModelLoaded = () => useStore($initialized)

/**
 * Current view id
 */
export const $viewId = atom(viewId)

export const changeViewId = (viewId: ViewID) => {
  $viewId.set(viewId)
}

messenger.onNotification(OnOpenView, ({ viewId }) => {
  $viewId.set(viewId)
  saveVscodeState({ viewId })
})

export type LikeC4DiagramsAtom = Record<
  ViewID,
  {
    // Never loaded
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
>
export const $likeC4Diagrams = map<LikeC4DiagramsAtom>(
  view
    ? {
      [view.id]: {
        state: 'stale',
        view,
        error: null
      }
    }
    : {}
)

const EMPTY: ComputedLikeC4Model = {
  specification: {
    tags: [],
    elements: {},
    relationships: {}
  },
  elements: {},
  relations: {},
  globals: {
    styles: {}
  },
  views: {}
}

export const $likeC4ModelSource = deepMap({ ...EMPTY })

function updateLikeC4ModelSource(model: ComputedLikeC4Model) {
  const currentViews = $likeC4ModelSource.get().views

  const likeC4Diagrams = $likeC4Diagrams.get()

  $likeC4ModelSource.setKey('specification', model.specification)
  $likeC4ModelSource.setKey('elements', model.elements)
  $likeC4ModelSource.setKey('relations', model.relations)

  const oldKeys = new Set([...keys(currentViews)] as ViewID[])
  for (const view of values(model.views)) {
    oldKeys.delete(view.id)
    const likeC4Diagram = likeC4Diagrams[view.id]
    if (isNullish(currentViews[view.id]) || !isDeepEqual(currentViews[view.id], view)) {
      $likeC4ModelSource.setKey('views.' + view.id as any, view)
      if (likeC4Diagram) {
        $likeC4Diagrams.setKey(view.id, {
          ...likeC4Diagram,
          state: 'stale'
        })
      } else {
        $likeC4Diagrams.setKey(view.id, {
          state: 'pending',
          view: null,
          error: null
        })
      }
    }
  }

  for (const key of oldKeys.values()) {
    $likeC4ModelSource.setKey('views.' + key as any, undefined)
  }

  // Mark vies as not found
  for (const [key, likeC4Diagram] of entries(likeC4Diagrams)) {
    if (!(key in model.views)) {
      $likeC4Diagrams.setKey(key as ViewID, {
        ...likeC4Diagram,
        error: 'View is not found',
        state: 'error'
      })
    }
  }
}

async function fetchComputedModel() {
  const { model } = await ExtensionApi.fetchComputedModel()
  if (model) {
    updateLikeC4ModelSource(model)
  }
}

onMount($likeC4ModelSource, () => {
  task(async () => {
    await fetchComputedModel()
    $initialized.set(true)
  })
})

messenger.onNotification(BroadcastModelUpdate, () => {
  fetchComputedModel()
})

export const $likeC4Model = batched($likeC4ModelSource, m => LikeC4Model.computed(m as any))

const $likeC4View = batched([$viewId, $likeC4Diagrams], (viewId, diagrams) => diagrams[viewId]?.view ?? null)
const $likeC4ViewState = batched([$viewId, $likeC4Diagrams], (viewId, diagrams) => diagrams[viewId]?.state ?? null)
const $likeC4ViewError = batched([$viewId, $likeC4Diagrams], (viewId, diagrams) => diagrams[viewId]?.error ?? null)

onMount($likeC4View, () => {
  return $likeC4View.listen(view => {
    if (view) {
      saveVscodeState({
        viewId: view.id,
        view
      })
    }
  })
})

onMount($likeC4ViewState, () => {
  return $likeC4ViewState.subscribe((state) => {
    if (state === 'pending' || state === 'stale') {
      fetchDiagramView($viewId.get()).catch(e => console.error(e))
    }
  })
})

async function fetchDiagramView(viewId: ViewID) {
  const {
    error,
    view
  } = await ExtensionApi.fetchDiagramView(viewId)
  const currentView = $likeC4Diagrams.get()[viewId]?.view ?? null
  if (error) {
    $likeC4Diagrams.setKey(viewId, {
      state: 'error',
      view: view || currentView,
      error
    })
    return
  }
  if (!view) {
    $likeC4Diagrams.setKey(viewId, {
      state: 'error',
      view: currentView,
      error: `Invalid response without view`
    })
    return
  }

  $likeC4Diagrams.setKey(viewId, {
    state: 'success',
    view: currentView && isDeepEqual(view, currentView) ? currentView : view,
    error: null
  })
}

export function useLikeC4View() {
  const state = useStore($likeC4ViewState)
  const error = useStore($likeC4ViewError)
  const view = useStore($likeC4View)
  const prevViewRef = useRef(view)
  // if view is not null - save it as previous
  if (view) {
    prevViewRef.current = view
  }
  return {
    state: state ?? 'pending',
    view: view ?? prevViewRef.current,
    error
  }
}

const $lastClickedNode = atom<DiagramNode | null>(null)

export const setLastClickedNode = (node?: DiagramNode) => {
  $lastClickedNode.set(node ?? null)
}

messenger.onRequest(GetLastClickedNode, () => {
  return {
    elementId: $lastClickedNode.get()?.id ?? null
  }
})
