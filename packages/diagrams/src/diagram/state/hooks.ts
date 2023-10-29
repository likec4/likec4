import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { hoveredEdgeAtom, hoveredEdgeIdAtom, hoveredNodeAtom, hoveredNodeIdAtom } from './atoms'

export function useHoveredNode() {
  return useAtom(hoveredNodeAtom)
}

export function useHoveredNodeId() {
  return useAtomValue(hoveredNodeIdAtom)
}

export function useSetHoveredNode() {
  return useSetAtom(hoveredNodeAtom)
}

export function useHoveredEdge() {
  return useAtom(hoveredEdgeAtom)
}

export function useHoveredEdgeId() {
  return useAtomValue(hoveredEdgeIdAtom)
}

export function useSetHoveredEdge() {
  return useSetAtom(hoveredEdgeAtom)
}
