import { nonexhaustive } from '@likec4/core'
import type { InternalNode, Rect, XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { hasAtLeast, map, pipe, sortBy } from 'remeda'
import type { DiagramState } from '../hooks'
import type { XYFlowNode } from '../xyflow/types'
import { createLayoutConstraints } from '../xyflow/useLayoutConstraints'

type LinearAlignmentMode = 'Left' | 'Center' | 'Right' | 'Top' | 'Middle' | 'Bottom'
type GridAlignmentMode = 'Column' | 'Row'
export type AlignmentMode = LinearAlignmentMode | GridAlignmentMode

abstract class Aligner {
  abstract computeLayout(nodes: InternalNode<XYFlowNode>[]): void
  abstract applyPosition(node: InternalNode<XYFlowNode>): Partial<XYPosition>
}

class LinearAligner extends Aligner {
  private alignTo: number | undefined
  constructor(
    private getEdgePosition: (nodes: InternalNode<XYFlowNode>[]) => number,
    private getPosition: (alignTo: number, node: InternalNode<XYFlowNode>) => number,
    private propertyToEdit: keyof XYPosition
  ) {
    super()
  }

  override computeLayout(nodes: InternalNode<XYFlowNode>[]) {
    this.alignTo = this.getEdgePosition(nodes)
  }

  override applyPosition(node: InternalNode<XYFlowNode>): Partial<XYPosition> {
    return {
      [this.propertyToEdit]: this.getPosition(this.alignTo!, node)
    }
  }
}

type NodeRect = Rect & { id: string }

class GridAligner extends Aligner {
  private layout: Map<string, XYPosition> = new Map()
  private axisPreset: {
    primaryAxisDimension: 'height' | 'width'
    secondaryAxisDimension: 'height' | 'width'
    primaryAxisCoord: 'x' | 'y'
    secondaryAxisCoord: 'x' | 'y'
  }

  constructor(alignmentMode: GridAlignmentMode) {
    super()

    this.axisPreset = alignmentMode === 'Column'
      ? {
        primaryAxisDimension: 'width',
        secondaryAxisDimension: 'height',
        primaryAxisCoord: 'x',
        secondaryAxisCoord: 'y'
      }
      : {
        primaryAxisDimension: 'height',
        secondaryAxisDimension: 'width',
        primaryAxisCoord: 'y',
        secondaryAxisCoord: 'x'
      }
  }

  override applyPosition(node: InternalNode<XYFlowNode>): Partial<XYPosition> {
    return this.layout?.get(node.id) ?? {}
  }

  override computeLayout(nodes: InternalNode<XYFlowNode>[]) {
    // Sort by position
    const sortedNodeRects = pipe(
      nodes,
      map(n =>
        ({
          ...n.internals.positionAbsolute,
          id: n.id,
          width: getNodeDimensions(n).width,
          height: getNodeDimensions(n).height
        }) as NodeRect
      ),
      sortBy(r => r[this.axisPreset.primaryAxisCoord])
    )
    const x = Math.min(...sortedNodeRects.map(n => n.x))
    const y = Math.min(...sortedNodeRects.map(n => n.y))
    const right = Math.max(...sortedNodeRects.map(n => n.x + n.width))
    const bottom = Math.max(...sortedNodeRects.map(n => n.y + n.height))

    const layoutRect: Rect = {
      x,
      y,
      width: right - x,
      height: bottom - y
    }

    // Group by rows
    const layers: { primaryAxisSize: number; nodes: NodeRect[] }[] = []
    let layerStart = 0
    let layerEnd = 0
    let layer = null

    for (let node of sortedNodeRects) {
      if (!!layer && node[this.axisPreset.primaryAxisCoord] < layerEnd) {
        layer.nodes.push(node)
        layer.primaryAxisSize = Math.max(layer.primaryAxisSize, node[this.axisPreset.primaryAxisDimension])
        layerEnd = Math.max(
          node[this.axisPreset.primaryAxisCoord] + node[this.axisPreset.primaryAxisDimension],
          layerEnd
        )
      } else {
        layer = { primaryAxisSize: node[this.axisPreset.primaryAxisDimension], nodes: [node] }
        layers.push(layer)
        layerStart = node[this.axisPreset.primaryAxisCoord]
        layerEnd = node[this.axisPreset.primaryAxisCoord] + node[this.axisPreset.primaryAxisDimension]
        continue
      }
    }

    // Find position in a row
    const occupiedSpace = layers.reduce((a, b) => a + b.primaryAxisSize, 0)
    const rowMargin = layers.length > 1
      ? (layoutRect[this.axisPreset.primaryAxisDimension] - occupiedSpace) / (layers.length - 1)
      : 0
    let placeNextRowAt = layoutRect[this.axisPreset.primaryAxisCoord]
    for (let layer of layers) {
      if (layer.nodes.length == 1) {
        this.centerInRow(layer, layoutRect, placeNextRowAt)
      }
      else {
        this.fillRow(layer, layoutRect, placeNextRowAt)
      }

      placeNextRowAt += layer.primaryAxisSize + rowMargin
    }
  }

  private fillRow(
    layer: { primaryAxisSize: number; nodes: NodeRect[] },
    layoutRect: Rect,
    placeNextLayerAt: number
  ) {
    const occupiedSpace = layer.nodes.map(n => n[this.axisPreset.secondaryAxisDimension]).reduce((a, b) => a + b, 0)
    const freeSpace = layoutRect[this.axisPreset.secondaryAxisDimension] - occupiedSpace

    const margin = freeSpace / (layer.nodes.length - 1)

    let placeNextNodeAt = layoutRect[this.axisPreset.secondaryAxisCoord]
    for (let node of sortBy(layer.nodes, n => n[this.axisPreset.secondaryAxisCoord])) {
      this.layout.set(node.id, {
        [this.axisPreset.secondaryAxisCoord]: placeNextNodeAt,
        [this.axisPreset.primaryAxisCoord]: placeNextLayerAt
      } as XYPosition)
      placeNextNodeAt += node[this.axisPreset.secondaryAxisDimension] + margin
    }
  }

  private centerInRow(
    layer: { primaryAxisSize: number; nodes: NodeRect[] },
    layoutRect: Rect,
    placeNextLayerAt: number
  ) {
    const occupiedSpace = layer.nodes.map(n => n[this.axisPreset.secondaryAxisDimension]).reduce((a, b) => a + b, 0)
    const freeSpace = layoutRect[this.axisPreset.secondaryAxisDimension] - occupiedSpace

    const margin = freeSpace / (layer.nodes.length + 1)

    let placeNextNodeAt = layoutRect[this.axisPreset.secondaryAxisCoord] + margin
    for (let node of sortBy(layer.nodes, n => n[this.axisPreset.secondaryAxisCoord])) {
      this.layout.set(node.id, {
        [this.axisPreset.secondaryAxisCoord]: placeNextNodeAt,
        [this.axisPreset.primaryAxisCoord]: placeNextLayerAt
      } as XYPosition)
      placeNextNodeAt += node[this.axisPreset.secondaryAxisDimension] + margin
    }
  }
}

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

    constraints.onMove((nodes) => {
      aligner.computeLayout(nodes.map(({ node }) => node))

      nodes.forEach(({ rect, node }) => {
        rect.positionAbsolute = {
          ...rect.positionAbsolute,
          ...aligner.applyPosition(node)
        }
      })
    })

    scheduleSaveManualLayout()
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

function getLinearAligner(mode: LinearAlignmentMode): Aligner {
  switch (mode) {
    case 'Left':
      return new LinearAligner(
        nodes => Math.min(...nodes.map(n => n.internals.positionAbsolute.x)),
        (alignTo, _) => Math.floor(alignTo),
        'x'
      )
    case 'Top':
      return new LinearAligner(
        nodes => Math.min(...nodes.map(n => n.internals.positionAbsolute.y)),
        (alignTo, _) => Math.floor(alignTo),
        'y'
      )
    case 'Right':
      return new LinearAligner(
        nodes => Math.max(...nodes.map(n => n.internals.positionAbsolute.x + getNodeDimensions(n).width)),
        (alignTo, node) => Math.floor(alignTo - node.width!),
        'x'
      )
    case 'Bottom':
      return new LinearAligner(
        nodes => Math.max(...nodes.map(n => n.internals.positionAbsolute.y + getNodeDimensions(n).height)),
        (alignTo, node) => Math.floor(alignTo - node.height!),
        'y'
      )
    case 'Center':
      return new LinearAligner(
        nodes => Math.max(...nodes.map(n => n.internals.positionAbsolute.x + getNodeDimensions(n).width / 2)),
        (alignTo, node) => Math.floor(alignTo - getNodeDimensions(node).width / 2),
        'x'
      )
    case 'Middle':
      return new LinearAligner(
        nodes => Math.max(...nodes.map(n => n.internals.positionAbsolute.y + getNodeDimensions(n).height / 2)),
        (alignTo, node) => Math.floor(alignTo - getNodeDimensions(node).height / 2),
        'y'
      )
  }
}
