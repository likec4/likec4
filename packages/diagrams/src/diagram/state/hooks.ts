import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { hoveredEdgeAtom, hoveredEdgeIdAtom, hoveredNodeAtom, hoveredNodeIdAtom } from './atoms'
import { useCallback } from 'react'
import type { DiagramNode } from '../types'

export const useHoveredNode = () => {
  return useAtom(hoveredNodeAtom)
}

export const useHoveredNodeId = () => {
  return useAtomValue(hoveredNodeIdAtom)
}

export const useSetHoveredNode = () => {
  return useSetAtom(hoveredNodeAtom)
}

export const useGetNodeState = (nodeId: DiagramNode['id']) => {
  const isHovered = useAtomValue(
    selectAtom(
      hoveredNodeAtom,
      useCallback(node => node?.id === nodeId, [nodeId])
    )
  )
  return { isHovered }
}

export const useHoveredEdgeId = () => {
  return useAtomValue(hoveredEdgeIdAtom)
}

export const useSetHoveredEdge = () => {
  return useSetAtom(hoveredEdgeAtom)
}
