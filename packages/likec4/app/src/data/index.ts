import { useStore } from '@nanostores/react'
import { $views } from 'virtual:likec4'

export function useLikeC4Views() {
  return useStore($views)
}

export function useLikeC4View(id: string) {
  const views = useStore($views, {
    keys: [id]
  })
  return views[id] ?? null
}
