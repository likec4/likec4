import type { ComputedView, Fqn, RelationID, ViewID } from '@likec4/core'
import { atom } from 'jotai'
import { loadable, selectAtom } from 'jotai/utils'
import { equals, head, keys, once } from 'rambdax'

export interface FilesStore {
  current: string
  files: Record<string, string>
}

export const currentFileAtom = atom('')

export const filesAtom = atom({} as Record<string, string>)

export const updateCurrentFileAtom = atom(null, (get, set, value: string) => {
  const current = get(currentFileAtom)
  const files = get(filesAtom)
  set(filesAtom, {
    ...files,
    [current]: value
  })
})

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
  ({ id, views }) => {
    if (!id) return null
    return views[id] ?? null
  },
  equals
)

const getDotLayouter = once(async () => {
  console.debug('Loading dot layouter')
  const { DotLayouter } = await import('@likec4/layouts')
  return new DotLayouter()
})

export const diagramAtom = atom(async get => {
  const view = get(currentViewAtom)
  if (!view) return null
  const layouter = await getDotLayouter()
  try {
    const { diagram } = await layouter.layout(view)
    return diagram
  } catch (e) {
    console.error(e)
    throw e
  }
})

export const loadableDiagramAtom = loadable(diagramAtom)

export type EditorRevealRequest = { element: Fqn } | { view: ViewID } | { relation: RelationID }

export const editorRevealRequestAtom = atom<EditorRevealRequest | null>(null)
