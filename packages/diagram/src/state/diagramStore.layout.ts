import { nonexhaustive } from '@likec4/core'
import type { InternalNode } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { hasAtLeast } from 'remeda'
import type { DiagramState } from '../hooks'
import type { XYFlowNode } from '../xyflow/types'
import { createLayoutConstraints } from '../xyflow/useLayoutConstraints'
import { type Aligner, getLinearAligner, GridAligner, type GridAlignmentMode, type LinearAlignmentMode, type NodeRect } from './aligners'

export type AlignmentMode = LinearAlignmentMode | GridAlignmentMode

export function align(get: () => DiagramState) {
  return (mode: AlignmentMode) => {
    const { scheduleSaveManualLayout, xystore } = get()
    const { nodeLookup, parentLookup } = xystore.getState()

    const selectedNodes = new Set(nodeLookup.values().filter(n => n.selected).map(n => n.id))
    const nodesToAlign = [...selectedNodes.difference(new Set(parentLookup.keys()))]

    if (!hasAtLeast(nodesToAlign, 2)) {
      console.warn('At least 2 nodes must be selected to align')
      return
    }
    const constraints = createLayoutConstraints(xystore, nodesToAlign)

    const aligner = getAligner(mode)

    constraints.onMove(nodes => {
      aligner.computeLayout(nodes.map(({ node }) => toNodeRect(node)))

      nodes.forEach(({ rect, node }) => {
        rect.positionAbsolute = {
          ...rect.positionAbsolute,
          ...aligner.applyPosition(toNodeRect(node))
        }
      })
    })

    scheduleSaveManualLayout()
  }
}

function toNodeRect(node: InternalNode<XYFlowNode>): NodeRect {
  return {
    ...node.internals.positionAbsolute,
    id: node.id,
    width: getNodeDimensions(node).width,
    height: getNodeDimensions(node).height
  }
}

function getAligner(mode: AlignmentMode): Aligner {
  switch (mode) {
    case 'Left':
    case 'Right':
    case 'Top':
    case 'Bottom':
    case 'Center':
    case 'Middle':
      return getLinearAligner(mode)
    case 'Column':
    case 'Row':
      return new GridAligner(mode)
    default:
      nonexhaustive(mode)
  }
}