import type { DiagramView } from '@likec4/core'
import { atom } from 'jotai'
import { atomFamily, atomWithReducer } from 'jotai/utils'
import { equals, mapObject, values } from 'rambdax'
import { LikeC4Views } from 'virtual:likec4/views'
import { buildDiagramTreeAtom } from './sidebar-diagram-tree'

function atomWithCompare<Value>(initialValue: Value) {
  return atomWithReducer(initialValue, (prev: Value, next: Value) => {
    if (equals(prev, next)) {
      return prev
    }
    return next
  })
}

const likec4ViewFamily = atomFamily(
  (view: DiagramView) => {
    const atom = atomWithCompare(view)
    atom.debugLabel = `view#${view.id}`
    return atom
  },
  (a, b) => a.id === b.id
)

const mapToAtoms = (views: typeof LikeC4Views) => mapObject(view => likec4ViewFamily(view), views)

const _viewsAtom = atom(mapToAtoms(LikeC4Views))
_viewsAtom.debugLabel = '_views'

export const viewsAtom = atom(
  get => get(_viewsAtom),
  (_, set, update: typeof LikeC4Views) => {
    set(
      _viewsAtom,
      mapObject(view => {
        const atom = likec4ViewFamily(view)
        set(atom, view)
        return atom
      }, update)
    )
  }
)
viewsAtom.debugLabel = 'views'

export const diagramsTreeAtom = atom(get => {
  const views = values(get(viewsAtom))
  return buildDiagramTreeAtom(views.map(v => get(v)))
})

export const selectLikeC4ViewAtom = (viewId: string) => {
  return atom(get => {
    const viewAtom = get(viewsAtom)[viewId]
    return viewAtom ? get(viewAtom) : null
  })
}

if (import.meta.hot) {
  let $updateViews: undefined | ((update: typeof LikeC4Views) => void)

  viewsAtom.onMount = set => {
    $updateViews = set
    return () => {
      $updateViews = undefined
    }
  }

  import.meta.hot.accept('/@vite-plugin-likec4/likec4-views', md => {
    const update = md?.LikeC4Views
    if (update) {
      $updateViews?.(update)
    }
  })
}
