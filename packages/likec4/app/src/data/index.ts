import { type DiagramView } from '@likec4/core'
import { useStore } from '@nanostores/react'
import { map } from 'nanostores'
import { LikeC4Views } from './_hmr'

let keys = new Set(Object.keys(LikeC4Views))
export const $views = map(LikeC4Views as unknown as Record<string, DiagramView>)

export function useLikeC4Views() {
  return useStore($views)
}

export function useLikeC4View(id: string) {
  const views = useStore($views, {
    keys: [id]
  })
  return views[id] ?? null
}

if (import.meta.env.DEV) {
  import.meta.hot?.accept('./_hmr', md => {
    const update = md?.LikeC4Views as Record<string, DiagramView>
    if (update) {
      const currents = $views.get()
      let newKeys = new Set<string>()
      for (const [id, view] of Object.entries(update)) {
        newKeys.add(id)
        $views.setKey(id, view)
      }
      for (const key of keys) {
        if (!newKeys.has(key)) {
          // @ts-ignore
          $views.setKey(key, undefined)
        }
      }
      keys = newKeys
    } else {
      import.meta.hot?.invalidate()
    }
  })
}
