import { type Fqn, type LikeC4Model, type ViewId, DiagramNode } from '@likec4/core'
import { createSafeContext } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { useStore } from '@nanostores/react'
import { atom, computed, onMount } from 'nanostores'
import { useDeferredValue } from 'react'
import { useDiagram } from '../../../hooks/useDiagram'

const $search = atom('')
onMount($search, () => {
  // reset search on mount
  $search.set('')
})

export function setSearch(term: string) {
  $search.set(term)
}

export function useSearch() {
  return useStore($search)
}

const $normalizedSearch = computed($search, search => {
  const v = search.trim().toLowerCase()
  return v.length > 1 ? v : ''
})
export function useNormalizedSearch() {
  return useDeferredValue(useStore($normalizedSearch))
}

export const [LikeC4SearchContext, useCloseSearch] = createSafeContext<(cb?: () => void) => void>('LikeC4Search')

type PickView = {
  elementFqn: Fqn
  scoped: LikeC4Model.View[]
  others: LikeC4Model.View[]
}
const $pickView = atom<PickView | null>(null)
onMount($search, () => {
  // reset search on mount
  $pickView.set(null)
})

export function usePickView() {
  return useStore($pickView)
}
export function setPickView(data: PickView | null) {
  $pickView.set(data)
}
export function wasResetPickView() {
  if ($pickView.get() !== null) {
    $pickView.set(null)
    return true
  }
  return false
}

const $pickViewActive = computed($pickView, pickView => pickView !== null)
export function useIsPickViewActive() {
  return useStore($pickViewActive)
}

export function useCloseSearchAndNavigateTo() {
  const diagram = useDiagram()
  const close = useCloseSearch()
  return useCallbackRef((viewId: ViewId, fromElementFqn?: Fqn) => {
    close(() => {
      fromElementFqn ??= $pickView.get()?.elementFqn
      setPickView(null)
      const fromNode = fromElementFqn
        ? diagram.getContext().view.nodes.find(n => DiagramNode.modelRef(n) === fromElementFqn)?.id
        : undefined
      if (diagram.currentView().id === viewId && fromNode) {
        diagram.focusNode(fromNode)
        return
      }
      diagram.navigateTo(viewId, fromNode)
    })
  })
}
