import type { ExtractAtomValue } from 'jotai'
import { atom } from 'jotai'
import { viewsAtom } from './atoms'
import { groupBy, values } from 'remeda'
import { splitAtom } from 'jotai/utils'

/**
 * Views grouped by folder
 */
const viewGroupsAtom = atom(get => {
  const views = values(get(viewsAtom))
  const byPath = groupBy(views, v => get(v).relativePath ?? '')
  return Object.entries(byPath)
    .map(([path, views]) => ({
      path,
      isRoot: path === '',
      views
    }))
    .sort((a, b) => {
      return a.path.localeCompare(b.path)
    })
})
export type ViewsGroup = ExtractAtomValue<typeof viewGroupsAtom>[number]

const byPath = (tile: ViewsGroup) => tile.path
export const viewsGroupAtomsAtom = splitAtom(viewGroupsAtom, byPath)
