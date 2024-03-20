import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { diagramsTreeAtom, selectLikeC4ViewAtom } from './atoms'
import { type ViewsGroup, viewsGroupAtomsAtom } from './index-page'

export const useLikeC4View = (viewId: string) => {
  const anAtom = useMemo(() => selectLikeC4ViewAtom(viewId), [viewId])
  return useAtomValue(anAtom)
}

export const useDiagramsTree = () => useAtomValue(diagramsTreeAtom)

export type { ViewsGroup }
export const useViewGroupsAtoms = () => {
  return useAtomValue(viewsGroupAtomsAtom)
}
