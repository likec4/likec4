import { useAtom, useSetAtom } from 'jotai'
import { hoveredNodeAtom } from './atoms'

export const useHoveredNode = () => {
  return useAtom(hoveredNodeAtom)
}

export const useSetHoveredNode = () => {
  return useSetAtom(hoveredNodeAtom)
}
