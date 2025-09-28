/**
 * This module is used by the Vite plugin to generate the virtual modules
 */
import { LikeC4Model } from '@likec4/core/model'
import type { DiagramView, LayoutedLikeC4ModelData } from '@likec4/core/types'
import { useStore } from '@nanostores/react'
import { type Atom, type WritableAtom, computed } from 'nanostores'
import { useEffect, useState } from 'react'
import { isDeepEqual, mapValues } from 'remeda'

export { atom, batched, computed, map } from 'nanostores'

export { useStore } from '@nanostores/react'

export type { Atom, ReadableAtom, WritableAtom } from 'nanostores'

// This is a workaround to avoid type errors in the Vite plugin
export const createHooksForModel: ($atom: WritableAtom) => any = ($atom: WritableAtom<LayoutedLikeC4ModelData>): {
  updateModel: (data: LayoutedLikeC4ModelData) => void
  $likec4model: Atom<LikeC4Model.Layouted>
  useLikeC4Model: () => LikeC4Model.Layouted
  useLikeC4Views: () => ReadonlyArray<DiagramView>
  useLikeC4View: (viewId: string) => DiagramView | null
} => {
  const $likec4model = computed($atom, (data) => LikeC4Model.create(data))

  function updateModel(data: LayoutedLikeC4ModelData) {
    const current = $atom.get()
    if (isDeepEqual(current, data)) {
      return
    }

    const next = {
      ...data,
      views: mapValues(data.views, (next) => {
        const currentView = current.views[next.id]
        return isDeepEqual(currentView, next) ? currentView : next
      }),
    }
    $atom.set(next as LayoutedLikeC4ModelData)
  }

  const $likec4views: Atom<ReadonlyArray<DiagramView>> = computed(
    $atom,
    (model) => Object.values(model.views),
  )

  function useLikeC4Model(): LikeC4Model.Layouted {
    return useStore($likec4model)
  }

  function useLikeC4Views(): ReadonlyArray<DiagramView> {
    return useStore($likec4views)
  }

  function useLikeC4View(viewId: string): DiagramView | null {
    const [view, setView] = useState($atom.value?.views[viewId] ?? null)
    useEffect(() => {
      return $atom.subscribe((next) => {
        setView(next.views[viewId] ?? null)
      })
    }, [viewId])
    return view
  }

  return {
    updateModel,
    $likec4model,
    useLikeC4Model,
    useLikeC4Views,
    useLikeC4View,
  }
}
