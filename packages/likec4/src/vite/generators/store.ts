export const storeSource = `
import { useStore } from '@nanostores/react'
import { map } from 'nanostores'
import { LikeC4Views } from 'virtual:likec4/views'

export let $views = map(LikeC4Views)

export let useLikeC4Views = () => {
  return useStore($views)
}

export let useLikeC4View = (id) => {
  const views = useStore($views, {
    keys: [id]
  })
  return views[id] ?? null
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    const update = md.$views
    if (update) {
      if (!import.meta.hot.data.$current) {
        import.meta.hot.data.$current = $views
      }
      const $current = import.meta.hot.data.$current
      const newKeys = new Set()
      for (const [id, view] of Object.entries(update.get())) {
        newKeys.add(id)
        $current.setKey(id, view)
      }
      for (const key of Object.keys($current.get())) {
        if (!newKeys.has(key)) {
          $current.setKey(key, undefined)
        }
      }
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
