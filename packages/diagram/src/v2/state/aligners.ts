import { type NonEmptyArray, invariant, nonexhaustive } from '@likec4/core'
import type { InternalNode, Rect, XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { map, pick, pipe, reduce, sortBy } from 'remeda'

export type GridAlignmentMode = 'Column' | 'Row'
export type LinearAlignmentMode = 'Left' | 'Center' | 'Right' | 'Top' | 'Middle' | 'Bottom'
export type AlignmentMode = LinearAlignmentMode | GridAlignmentMode

export abstract class Aligner {
  abstract computeLayout(nodes: NodeRect[]): void
  abstract applyPosition(node: NodeRect): Partial<XYPosition>
}

export class LinearAligner extends Aligner {
  private alignTo: number | undefined
  constructor(
    private getEdgePosition: (nodes: NodeRect[]) => number,
    private computePosition: (alignTo: number, node: NodeRect) => number,
    private propertyToEdit: keyof XYPosition,
  ) {
    super()
  }

  override computeLayout(nodes: NodeRect[]) {
    this.alignTo = this.getEdgePosition(nodes)
  }

  override applyPosition(node: NodeRect): Partial<XYPosition> {
    return {
      [this.propertyToEdit]: this.computePosition(this.alignTo!, node),
    }
  }
}

export type NodeRect = Rect & { id: string }
type Layer = {
  primaryAxisSize: number
  nodes: NodeRect[]
  occupiedSpace: number
  layout: Layout | null
}
type Layout = {
  nodePositions: Map<string, XYPosition>
  refLayer: Layer | null
}

export class GridAligner extends Aligner {
  private layout: Map<string, XYPosition> = new Map()
  private axisPreset: {
    primaryAxisDimension: 'height' | 'width'
    secondaryAxisDimension: 'height' | 'width'
    primaryAxisCoord: 'x' | 'y'
    secondaryAxisCoord: 'x' | 'y'
  }

  private get primaryAxisCoord() {
    return this.axisPreset.primaryAxisCoord
  }
  private get secondaryAxisCoord() {
    return this.axisPreset.secondaryAxisCoord
  }
  private get primaryAxisDimension() {
    return this.axisPreset.primaryAxisDimension
  }
  private get secondaryAxisDimension() {
    return this.axisPreset.secondaryAxisDimension
  }

  constructor(alignmentMode: GridAlignmentMode) {
    super()

    this.axisPreset = alignmentMode === 'Column'
      ? {
        primaryAxisDimension: 'width',
        secondaryAxisDimension: 'height',
        primaryAxisCoord: 'x',
        secondaryAxisCoord: 'y',
      }
      : {
        primaryAxisDimension: 'height',
        secondaryAxisDimension: 'width',
        primaryAxisCoord: 'y',
        secondaryAxisCoord: 'x',
      }
  }

  override applyPosition(node: NodeRect): Partial<XYPosition> {
    return this.layout?.get(node.id) ?? {}
  }

  override computeLayout(nodes: NodeRect[]) {
    // Sort by primary axis
    const sortedNodeRects = pipe(
      nodes,
      sortBy(r => r[this.primaryAxisCoord]),
    )

    const layoutRect = this.getLayoutRect(sortedNodeRects)

    const layers = this.getLayers(sortedNodeRects)

    this.layout = this.buildLayout(layers, layoutRect, sortedNodeRects)
  }

  private getLayoutRect(nodeRects: NodeRect[]): Rect {
    const x = Math.min(...nodeRects.map(n => n.x))
    const y = Math.min(...nodeRects.map(n => n.y))
    const right = Math.max(...nodeRects.map(n => n.x + n.width))
    const bottom = Math.max(...nodeRects.map(n => n.y + n.height))

    return {
      x,
      y,
      width: right - x,
      height: bottom - y,
    }
  }

  private getLayers(sortedNodeRects: NodeRect[]): NonEmptyArray<Layer> {
    const layers: Layer[] = []
    let layerEnd = 0
    let layer = null

    for (let node of sortedNodeRects) {
      if (!!layer && node[this.primaryAxisCoord] < layerEnd) {
        layer.nodes.push(node)
        layer.primaryAxisSize = Math.max(layer.primaryAxisSize, node[this.primaryAxisDimension])
        layer.occupiedSpace += node[this.secondaryAxisDimension]
        layerEnd = Math.max(
          node[this.primaryAxisCoord] + node[this.primaryAxisDimension],
          layerEnd,
        )
      } else {
        layer = {
          primaryAxisSize: node[this.primaryAxisDimension],
          nodes: [node],
          occupiedSpace: node[this.secondaryAxisDimension],
          layout: null,
        }
        layers.push(layer)
        layerEnd = node[this.primaryAxisCoord] + node[this.primaryAxisDimension]
        continue
      }
    }

    layers.forEach(l => l.nodes.sort((a, b) => a[this.secondaryAxisCoord] - b[this.secondaryAxisCoord]))

    return layers as NonEmptyArray<Layer>
  }

  private buildLayout(layers: NonEmptyArray<Layer>, layoutRect: Rect, nodeRects: NodeRect[]): Map<string, XYPosition> {
    const nodeMap = new Map(nodeRects.map(n => [n.id, n]))
    const layout: [string, XYPosition][] = []
    const occupiedSpace = layers.reduce((a, b) => a + b.primaryAxisSize, 0)
    const rowMargin = layers.length > 1
      ? (layoutRect[this.primaryAxisDimension] - occupiedSpace) / (layers.length - 1)
      : 0

    // Find the widest layer and layout diagram from there
    const baseLayerIndex = layers.reduce(
      (widestLayerIndex, layer, i) =>
        layers[widestLayerIndex]!.occupiedSpace < layer.occupiedSpace ? i : widestLayerIndex,
      0,
    )
    const baseLayer = layers[baseLayerIndex]!
    const baseLayerPosition = layers.slice(0, baseLayerIndex).reduce(
      (a, layer) => a + layer.primaryAxisSize + rowMargin,
      layoutRect[this.primaryAxisCoord],
    )
    const baseLayerLayout = this.buildLayerLayout(
      baseLayer,
      layoutRect,
      baseLayerPosition,
      nodeMap,
      null,
    )
    baseLayer.layout = baseLayerLayout
    layout.push(...baseLayerLayout.nodePositions)

    // Layout layers after the base layer
    let placeNextLayerAt = baseLayerPosition + baseLayer.primaryAxisSize + rowMargin
    let refLayer = baseLayer
    for (let i = baseLayerIndex + 1; i < layers.length; i++) {
      const layer = layers[i]!
      layer.layout = this.buildLayerLayout(layer, layoutRect, placeNextLayerAt, nodeMap, refLayer)

      layout.push(...layer.layout.nodePositions)
      refLayer = layer.layout.refLayer ?? layer
      placeNextLayerAt += layer.primaryAxisSize + rowMargin
    }

    // Layout layers before the base layer
    placeNextLayerAt = baseLayerPosition
    refLayer = baseLayer
    for (let i = baseLayerIndex - 1; i >= 0; i--) {
      const layer = layers[i]!
      placeNextLayerAt -= layer.primaryAxisSize + rowMargin

      layer.layout = this.buildLayerLayout(layer, layoutRect, placeNextLayerAt, nodeMap, refLayer)

      layout.push(...layer.layout.nodePositions)
      refLayer = layer.layout.refLayer ?? layer
    }

    return new Map(layout)
  }

  private buildLayerLayout(
    layer: Layer,
    layoutRect: Rect,
    placeNextLayerAt: number,
    nodeMap: Map<string, NodeRect>,
    refLayer: Layer | null,
  ): Layout {
    let bestLayerLayout = this.scoreLayout(
      this.spaceAround(layer, layoutRect, placeNextLayerAt),
      nodeMap,
    )

    if (layer.nodes.length != 1) {
      const currentlayerLayout = this.scoreLayout(
        this.spaceBetween(layer, layoutRect, placeNextLayerAt),
        nodeMap,
      )
      bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout
    }

    if (refLayer && refLayer.nodes.length - 1 >= layer.nodes.length) {
      const currentlayerLayout = this.scoreLayout(
        this.placeInGaps(layer, placeNextLayerAt, refLayer),
        nodeMap,
      )
      bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout
    }

    if (refLayer && refLayer.nodes.length >= layer.nodes.length) {
      const currentlayerLayout = this.scoreLayout(
        this.placeInCells(layer, placeNextLayerAt, refLayer),
        nodeMap,
      )
      bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout
    }

    return bestLayerLayout[1]
  }

  private spaceBetween(
    layer: Layer,
    layoutRect: Rect,
    placeNextLayerAt: number,
  ): Layout {
    const freeSpace = layoutRect[this.secondaryAxisDimension] - layer.occupiedSpace
    const margin = freeSpace / (layer.nodes.length - 1)

    let placeNextNodeAt = layoutRect[this.secondaryAxisCoord]
    const result = new Map<string, XYPosition>()

    let i = 0
    for (let node of layer.nodes) {
      result.set(node.id, {
        [this.secondaryAxisCoord]: placeNextNodeAt,
        [this.primaryAxisCoord]: placeNextLayerAt,
      } as XYPosition)
      placeNextNodeAt += node[this.secondaryAxisDimension] + margin
      i++
    }

    return { nodePositions: result, refLayer: null }
  }

  private spaceAround(
    layer: Layer,
    layoutRect: Rect,
    placeNextLayerAt: number,
  ): Layout {
    const freeSpace = layoutRect[this.secondaryAxisDimension] - layer.occupiedSpace
    const margin = freeSpace / (layer.nodes.length + 1)

    let placeNextNodeAt = layoutRect[this.secondaryAxisCoord] + margin
    const result = new Map<string, XYPosition>()

    for (let node of sortBy(layer.nodes, n => n[this.secondaryAxisCoord])) {
      result.set(node.id, {
        [this.secondaryAxisCoord]: placeNextNodeAt,
        [this.primaryAxisCoord]: placeNextLayerAt,
      } as XYPosition)
      placeNextNodeAt += node[this.secondaryAxisDimension] + margin
    }

    return { nodePositions: result, refLayer: null }
  }

  private placeInGaps(
    layer: Layer,
    placeNextLayerAt: number,
    refLayer: Layer,
  ): Layout {
    const result = new Map<string, XYPosition>()

    const nodes = layer.nodes
    const placementOptions = this.getGapsPositions(refLayer)

    let optionIndex = 0
    for (let i = 0, node = nodes[i]!; i < nodes.length; i++, node = nodes[i]!) {
      const nodeCenter = node[this.secondaryAxisCoord] + node[this.secondaryAxisDimension] / 2

      let bestOffset = Infinity
      while (optionIndex - i <= placementOptions.length - nodes.length) {
        let position = placementOptions[optionIndex]!
        const offset = position - nodeCenter

        if (Math.abs(offset) < Math.abs(bestOffset)) {
          bestOffset = offset

          optionIndex++
        }
        else {
          break
        }
      }

      result.set(node.id, {
        [this.secondaryAxisCoord]: node[this.secondaryAxisCoord] + bestOffset,
        [this.primaryAxisCoord]: placeNextLayerAt,
      } as XYPosition)
    }

    return { nodePositions: result, refLayer }
  }

  private placeInCells(
    layer: Layer,
    placeNextLayerAt: number,
    refLayer: Layer,
  ): Layout {
    const result = new Map<string, XYPosition>()

    const nodes = layer.nodes
    const placementOptions = this.getNodePositions(refLayer)

    let optionIndex = 0
    for (let i = 0, node = nodes[i]!; i < nodes.length; i++, node = nodes[i]!) {
      const nodeCenter = node[this.secondaryAxisCoord] + node[this.secondaryAxisDimension] / 2

      let bestOffset = Infinity

      while (optionIndex - i <= placementOptions.length - nodes.length) {
        let position = placementOptions[optionIndex]!
        const offset = position - nodeCenter

        if (Math.abs(offset) < Math.abs(bestOffset)) {
          bestOffset = offset

          optionIndex++
        }
        else {
          break
        }
      }

      result.set(node.id, {
        [this.secondaryAxisCoord]: node[this.secondaryAxisCoord] + bestOffset,
        [this.primaryAxisCoord]: placeNextLayerAt,
      } as XYPosition)
    }

    return { nodePositions: result, refLayer }
  }

  private scoreLayout(
    layout: Layout,
    originalRects: Map<string, NodeRect>,
  ): [number, Layout] {
    return [
      pipe(
        Array.from(layout.nodePositions),
        map(([id, position]) => {
          const originalRect = originalRects.get(id)
          invariant(originalRect, `Could not find original rect for node ${id}`)
          return [pick(originalRect, ['x', 'y']), position]
        }),
        map(([original, suggested]) =>
          Math.abs(original![this.secondaryAxisCoord] - suggested![this.secondaryAxisCoord])
        ),
        reduce((a, b) => a + b, 0),
      ),
      layout,
    ]
  }

  private getGapsPositions(layer: Layer): number[] {
    const result = []
    const { layout, nodes } = layer

    invariant(layout, 'Layout of the layer must be computed before calling getGapsPositions')

    for (let i = 1; i < nodes.length; i++) {
      const previousNode = nodes[i - 1]!
      const currentNode = nodes[i]!
      const previousNodePosition = layout.nodePositions.get(previousNode.id)!
      const currentNodePosition = layout.nodePositions.get(currentNode.id)!

      result.push(
        (currentNodePosition[this.secondaryAxisCoord]
          + previousNodePosition[this.secondaryAxisCoord]
          + previousNode[this.secondaryAxisDimension]) / 2,
      )
    }

    return result
  }

  private getNodePositions(layer: Layer): number[] {
    const result = []
    const { layout, nodes } = layer

    invariant(layout, 'Layout of the layer must be computed before calling getGapsPositions')

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!
      const nodePosition = layout.nodePositions.get(node.id)!

      result.push(
        nodePosition[this.secondaryAxisCoord]
          + node[this.secondaryAxisDimension] / 2,
      )
    }

    return result
  }
}

export function getLinearAligner(mode: LinearAlignmentMode): Aligner {
  switch (mode) {
    case 'Left':
      return new LinearAligner(
        nodes => Math.min(...nodes.map(n => n.x)),
        (alignTo, _) => Math.floor(alignTo),
        'x',
      )
    case 'Top':
      return new LinearAligner(
        nodes => Math.min(...nodes.map(n => n.y)),
        (alignTo, _) => Math.floor(alignTo),
        'y',
      )
    case 'Right':
      return new LinearAligner(
        nodes => Math.max(...nodes.map(n => n.x + n.width)),
        (alignTo, node) => Math.floor(alignTo - node.width!),
        'x',
      )
    case 'Bottom':
      return new LinearAligner(
        nodes => Math.max(...nodes.map(n => n.y + n.height)),
        (alignTo, node) => Math.floor(alignTo - node.height!),
        'y',
      )
    case 'Center':
      return new LinearAligner(
        nodes => Math.min(...nodes.map(n => n.x + n.width / 2)),
        (alignTo, node) => Math.floor(alignTo - node.width / 2),
        'x',
      )
    case 'Middle':
      return new LinearAligner(
        nodes => Math.min(...nodes.map(n => n.y + n.height / 2)),
        (alignTo, node) => Math.floor(alignTo - node.height / 2),
        'y',
      )
  }
}

export function toNodeRect(node: InternalNode): NodeRect {
  const { width, height } = getNodeDimensions(node)
  return {
    ...node.internals.positionAbsolute,
    id: node.id,
    width,
    height,
  }
}

export function getAligner(mode: AlignmentMode): Aligner {
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
