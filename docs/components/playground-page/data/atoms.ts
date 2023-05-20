import type { ComputedView, Fqn, RelationID } from '@likec4/core'
import type { ViewID } from '@likec4/diagrams'
import { dotLayout } from '@likec4/layouts'
import { atom } from 'jotai'
import { loadable, selectAtom } from 'jotai/utils'
import { equals, head, keys } from 'rambdax'

export interface FilesStore {
  current: string
  files: Record<string, string>
}

export const currentFileAtom = atom('')

export const filesAtom = atom({} as Record<string, string>)

export const updateCurrentFileAtom = atom(
  null,
  (get, set, value: string) => {
    const current = get(currentFileAtom)
    const files = get(filesAtom)
    set(filesAtom, {
      ...files,
      [current]: value
    })
  }
)

export const viewsReadyAtom = atom(false)

export const viewsAtom = atom(
  {} as Record<string, ComputedView>,
  (get, set, update: Record<string, ComputedView>) => {
    const wasReady = get(viewsReadyAtom)
    set(viewsReadyAtom, true)
    // const currentViews = get(viewsAtom)
    // let hasChanges = false
    // const views = map(
    //   (next, id) => {
    //     const current = currentViews[id]
    //     if (!!current && equals(current, next)) {
    //       return current
    //     } else {
    //       hasChanges = true
    //       return next
    //     }
    //   },
    //   update
    // )
    // if (hasChanges) {
      set(viewsAtom, update)
      if (!wasReady) {
        const viewId = 'index' in update ? 'index' : head(keys(update))
        if (viewId) {
          set(diagramIdAtom, viewId as ViewID)
        }
      }
    // }
  }
)

export const diagramIdAtom = atom<ViewID | null>(null)

export const currentViewAtom = selectAtom(
  atom(get => {
    const id = get(diagramIdAtom)
    const views = get(viewsAtom)
    return {
      id,
      views
    }
  }),
  ({id, views}) => {
    if (!id) return null
    return views[id] ?? null
  },
  equals
)

export const diagramAtom = atom(async get => {
  const view = get(currentViewAtom)
  if (!view) return null
  const diagram = await dotLayout(view)
  return diagram
})

export const loadableDiagramAtom = loadable(diagramAtom)

export type EditorRevealRequest =
  | { element: Fqn }
  | { view: ViewID }
  | { relation: RelationID }

export const editorRevealRequestAtom = atom<EditorRevealRequest | null>(null)
