import { useStore } from '@nanostores/react'
import { deepEqual } from 'fast-equals'
import { type DiagramView, type LayoutedLikeC4ModelData, type LikeC4Model, createLikeC4Model } from 'likec4/model'
import { type Atom, type WritableAtom, computed } from 'nanostores'
import { useMemo } from 'react'
import { mapValues } from 'remeda'

export function createHooksForModel($atom: WritableAtom<LayoutedLikeC4ModelData>): {
  updateModel: (data: LayoutedLikeC4ModelData) => void
  $likec4model: Atom<LikeC4Model.Layouted>
  useLikeC4Model: () => LikeC4Model.Layouted
  useLikeC4Views: () => ReadonlyArray<DiagramView>
  useLikeC4View: (viewId: string) => DiagramView | null
} {
  const $likec4model: Atom<LikeC4Model.Layouted> = computed($atom, (data) => createLikeC4Model(data))

  const $likec4views: Atom<ReadonlyArray<DiagramView>> = computed(
    $likec4model,
    (model) => [...Object.values(model.views)],
  )

  function useLikeC4Model(): LikeC4Model.Layouted {
    return useStore($likec4model)
  }

  function useLikeC4Views(): ReadonlyArray<DiagramView> {
    return useStore($likec4views)
  }

  function useLikeC4View(viewId: string): DiagramView | null {
    const $viewAtom = useMemo(() => {
      return computed($atom, (model) => model.views[viewId] ?? null)
    }, [viewId])
    return useStore($viewAtom)
  }

  function updateModel(data: LayoutedLikeC4ModelData) {
    const current = $atom.get()
    const next = {
      ...data,
      views: mapValues(data.views, (next) => {
        const currentView = current.views[next.id]
        return deepEqual(currentView, next) ? currentView : next
      }),
    }
    $atom.set(next as LayoutedLikeC4ModelData)
  }

  return {
    updateModel,
    $likec4model,
    useLikeC4Model,
    useLikeC4Views,
    useLikeC4View,
  }
}
import.meta.hot?.acceptExports
