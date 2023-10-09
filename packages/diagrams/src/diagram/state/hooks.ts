import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { hoveredEdgeAtom, hoveredEdgeIdAtom, hoveredNodeAtom, hoveredNodeIdAtom } from './atoms'
import { useCallback } from 'react'
import type { DiagramNode } from '../types'

export function useHoveredNode() {
  return useAtom(hoveredNodeAtom)
}

export function useHoveredNodeId() {
  return useAtomValue(hoveredNodeIdAtom)
}

export function useSetHoveredNode() {
  return useSetAtom(hoveredNodeAtom)
}

export function useGetNodeState(nodeId: DiagramNode['id']) {
  const isHovered = useAtomValue(
    selectAtom(
      hoveredNodeAtom,
      useCallback(node => node?.id === nodeId, [nodeId])
    )
  )
  return { isHovered }
}

export function useHoveredEdgeId() {
  return useAtomValue(hoveredEdgeIdAtom)
}

export function useSetHoveredEdge() {
  return useSetAtom(hoveredEdgeAtom)
}
