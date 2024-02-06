import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { useCallback, useMemo } from 'react'
import { useAtomValue, useSetAtom } from '../jotai'
import { hoveredEdgeIdAtom } from './atoms'

export const useSetHoveredEdgeId = () => useSetAtom(hoveredEdgeIdAtom)

export const useIsEdgeHovered = (edgeId: string) => {
  // const anAtom =
  return useAtomValue(useMemo(() => atom(get => get(hoveredEdgeIdAtom) === edgeId), [edgeId]))
  // return useAtomValue(selectAtom(hoveredEdgeIdAtom, useCallback(s => s === edgeId, [edgeId])))
}
