import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { diagramsTreeAtom, indexPageTilesAtomsAtom, selectLikeC4ViewAtom } from './atoms'

export const useLikeC4View = (viewId: string) => {
  const atom = useMemo(() => selectLikeC4ViewAtom(viewId), [viewId])
  return useAtomValue(atom)
}

export const useIndexPageTileAtoms = () => {
  return useAtomValue(indexPageTilesAtomsAtom)
}

export type { IndexPageTile } from './atoms'

export const useDiagramsTree = () => useAtomValue(diagramsTreeAtom)
