import { useStore } from '@nanostores/react'
import { batched } from 'nanostores'
import { groupBy, values } from 'remeda'
import { $views } from 'virtual:likec4'

const $viewGroups = batched($views, views => {
  const byPath = groupBy(values(views), v => v.relativePath ?? '')
  return Object.entries(byPath)
    .map(([path, views]) => ({
      path,
      isRoot: path === '',
      views: views.map(v => v.id)
    }))
    .sort((a, b) => {
      return a.path.localeCompare(b.path)
    })
})

export type ViewGroups = ReturnType<typeof $viewGroups['get']>

export function useViewGroups() {
  return useStore($viewGroups)
}
