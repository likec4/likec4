import { atom } from 'jotai'
import { useCallback, useMemo } from 'react'
import { useAtomValue, useSetAtom } from '../jotai'
import { hoveredEdgeIdAtom } from './atoms'

export const useSetHoveredEdgeId = () => useSetAtom(hoveredEdgeIdAtom)

export const useIsEdgeHovered = (edgeId: string) => {
  const anAtom = useMemo(() => atom(get => get(hoveredEdgeIdAtom) === edgeId), [edgeId])
  // anAtom.debugLabel = `useIsEdgeHovered.${edgeId}`
  return useAtomValue(anAtom)
}
