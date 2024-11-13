import { invariant, type NonEmptyArray } from '@likec4/core'
import type { Rect, XYPosition } from '@xyflow/react'
import { map, pick, pipe, reduce, sortBy } from 'remeda'

export type GridAlignmentMode = 'Column' | 'Row'

export abstract class Aligner {
  abstract computeLayout(nodes: NodeRect[]): void
  abstract applyPosition(node: NodeRect): Partial<XYPosition>
}

export class LinearAligner extends Aligner {
  private alignTo: number | undefined
  constructor(
    private getEdgePosition: (nodes: NodeRect[]) => number,
    private computePosition: (alignTo: number, node: NodeRect) => number,
    private propertyToEdit: keyof XYPosition
  ) {
    super()
  }

  override computeLayout(nodes: NodeRect[]) {
    this.alignTo = this.getEdgePosition(nodes)
  }

  override applyPosition(node: NodeRect): Partial<XYPosition> {
    return {
      [this.propertyToEdit]: this.computePosition(this.alignTo!, node)
    }
  }
}

export type NodeRect = Rect & { id: string }
type Layer = {
  primaryAxisSize: number
  nodes: NodeRect[]
  occupiedSpace: number
  cells: NonEmptyArray<LayoutCell> | null
}
type LayoutCell = { offset: number; size: number }

export class GridAligner extends Aligner {
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

  override applyPosition(node: NodeRect): Partial<XYPosition> {
    return this.layout?.get(node.id) ?? {}
  }

  override computeLayout(nodes: NodeRect[]) {
    // Sort by primary axis
    const sortedNodeRects = pipe(
      nodes,
      sortBy(r => r[this.axisPreset.primaryAxisCoord])
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
      height: bottom - y
    }
  }

  private getLayers(sortedNodeRects: NodeRect[]): Layer[] {
    const layers: Layer[] = []
    let layerEnd = 0
    let layer = null

    for (let node of sortedNodeRects) {
      if (!!layer && node[this.axisPreset.primaryAxisCoord] < layerEnd) {
        layer.nodes.push(node)
        layer.primaryAxisSize = Math.max(layer.primaryAxisSize, node[this.axisPreset.primaryAxisDimension])
        layer.occupiedSpace += node[this.axisPreset.secondaryAxisDimension]
        layerEnd = Math.max(
          node[this.axisPreset.primaryAxisCoord] + node[this.axisPreset.primaryAxisDimension],
          layerEnd
        )
      } else {
        layer = {
          primaryAxisSize: node[this.axisPreset.primaryAxisDimension],
          nodes: [node],
          occupiedSpace: node[this.axisPreset.secondaryAxisDimension],
          cells: null
        }
        layers.push(layer)
        layerEnd = node[this.axisPreset.primaryAxisCoord] + node[this.axisPreset.primaryAxisDimension]
        continue
      }
    }

    return layers
  }

  private buildLayout(layers: Layer[], layoutRect: Rect, nodeRects: NodeRect[]): Map<string, XYPosition> {
    const nodeMap = new Map(nodeRects.map(n => [n.id, n]))
    const layout: [string, XYPosition][] = []
    const occupiedSpace = layers.reduce((a, b) => a + b.primaryAxisSize, 0)
    const rowMargin = layers.length > 1
      ? (layoutRect[this.axisPreset.primaryAxisDimension] - occupiedSpace) / (layers.length - 1)
      : 0

    let placeNextLayerAt = layoutRect[this.axisPreset.primaryAxisCoord]
    let previousLayerCells = null
    for (let layer of layers) {
      let bestLayerLayout = this.scoreLayout(
        this.spaceAround(layer, layoutRect, placeNextLayerAt),
        nodeMap
      )

      if (layer.nodes.length != 1) {
        const currentlayerLayout = this.scoreLayout(
          this.spaceBetween(layer, layoutRect, placeNextLayerAt),
          nodeMap
        )
        bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout
      }

      if (previousLayerCells && previousLayerCells.length - 1 >= layer.nodes.length) {
        const currentlayerLayout = this.scoreLayout(
          this.placeInGaps(layer, placeNextLayerAt, previousLayerCells),
          nodeMap
        )
        bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout
      }

      if (previousLayerCells && previousLayerCells.length >= layer.nodes.length) {
        const currentlayerLayout = this.scoreLayout(
          this.placeInCells(layer, placeNextLayerAt, previousLayerCells),
          nodeMap
        )
        bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout
      }

      layout.push(...bestLayerLayout[2])
      previousLayerCells = bestLayerLayout[1]
      placeNextLayerAt += layer.primaryAxisSize + rowMargin
    }

    return new Map(layout)
  }

  private spaceBetween(
    layer: Layer,
    layoutRect: Rect,
    placeNextLayerAt: number
  ): [NonEmptyArray<LayoutCell>, Map<string, XYPosition>] {
    const freeSpace = layoutRect[this.axisPreset.secondaryAxisDimension] - layer.occupiedSpace
    const margin = freeSpace / (layer.nodes.length - 1)

    let placeNextNodeAt = layoutRect[this.axisPreset.secondaryAxisCoord]
    const result = new Map<string, XYPosition>()
    const cells = []

    let i = 0
    for (let node of sortBy(layer.nodes, n => n[this.axisPreset.secondaryAxisCoord])) {
      const isFirst = i === 0
      const isLast = i === layer.nodes.length - 1

      cells.push({
        offset: placeNextNodeAt - (isFirst ? 0 : margin / 2),
        size: node[this.axisPreset.secondaryAxisDimension] + (isFirst || isLast ? margin / 2 : margin)
      })
      result.set(node.id, {
        [this.axisPreset.secondaryAxisCoord]: placeNextNodeAt,
        [this.axisPreset.primaryAxisCoord]: placeNextLayerAt
      } as XYPosition)
      placeNextNodeAt += node[this.axisPreset.secondaryAxisDimension] + margin
      i++
    }

    return [cells as NonEmptyArray<LayoutCell>, result]
  }

  private spaceAround(
    layer: Layer,
    layoutRect: Rect,
    placeNextLayerAt: number
  ): [NonEmptyArray<LayoutCell>, Map<string, XYPosition>] {
    const freeSpace = layoutRect[this.axisPreset.secondaryAxisDimension] - layer.occupiedSpace
    const margin = freeSpace / (layer.nodes.length + 1)

    let placeNextNodeAt = layoutRect[this.axisPreset.secondaryAxisCoord] + margin
    const result = new Map<string, XYPosition>()
    const cells = []

    for (let node of sortBy(layer.nodes, n => n[this.axisPreset.secondaryAxisCoord])) {
      cells.push({
        offset: placeNextNodeAt - margin / 2,
        size: node[this.axisPreset.secondaryAxisDimension] + margin
      })
      result.set(node.id, {
        [this.axisPreset.secondaryAxisCoord]: placeNextNodeAt,
        [this.axisPreset.primaryAxisCoord]: placeNextLayerAt
      } as XYPosition)
      placeNextNodeAt += node[this.axisPreset.secondaryAxisDimension] + margin
    }

    return [cells as NonEmptyArray<LayoutCell>, result]
  }

  private placeInGaps(
    layer: Layer,
    placeNextLayerAt: number,
    previousLayerCells: NonEmptyArray<LayoutCell>
  ): [NonEmptyArray<LayoutCell>, Map<string, XYPosition>] {
    invariant(previousLayerCells, 'Layout of the previous layer was not computed')
    const result = new Map<string, XYPosition>()

    const sortedNodes = sortBy(layer.nodes, n => n[this.axisPreset.secondaryAxisCoord])
    const placementOptions = previousLayerCells
      .map(cell => cell.offset + cell.size)
      .slice(0, -1)

    let optionIndex = 0
    for (let i = 0, node = sortedNodes[i]!; i < sortedNodes.length; i++, node = sortedNodes[i]!) {
      const nodeCenter = node[this.axisPreset.secondaryAxisCoord] + node[this.axisPreset.secondaryAxisDimension] / 2

      let bestOffset = Infinity
      while (optionIndex - i <= placementOptions.length - sortedNodes.length) {
        let position = placementOptions[optionIndex]!
        const offset = position - nodeCenter

        if (Math.abs(offset) < Math.abs(bestOffset)) {
          bestOffset = offset

          optionIndex++
        }
        else {
          break;
        }
      }

      result.set(node.id, {
        [this.axisPreset.secondaryAxisCoord]: node[this.axisPreset.secondaryAxisCoord] + bestOffset,
        [this.axisPreset.primaryAxisCoord]: placeNextLayerAt
      } as XYPosition)
    }

    return [previousLayerCells, result]
  }

  private placeInCells(
    layer: Layer,
    placeNextLayerAt: number,
    previousLayerCells: NonEmptyArray<LayoutCell>,
  ): [NonEmptyArray<LayoutCell>, Map<string, XYPosition>] {
    invariant(previousLayerCells, 'Layout of the previous layer was not computed')
    const result = new Map<string, XYPosition>()

    const sortedNodes = sortBy(layer.nodes, n => n[this.axisPreset.secondaryAxisCoord])
    const placementOptions = previousLayerCells
      .map(cell => cell.offset + cell.size / 2)

    let optionIndex = 0
    for (let i = 0, node = sortedNodes[i]!; i < sortedNodes.length; i++, node = sortedNodes[i]!) {
      const nodeCenter = node[this.axisPreset.secondaryAxisCoord] + node[this.axisPreset.secondaryAxisDimension] / 2

      let bestOffset = Infinity

      while (optionIndex - i <= placementOptions.length - sortedNodes.length) {
        let position = placementOptions[optionIndex]!
        const offset = position - nodeCenter

        if (Math.abs(offset) < Math.abs(bestOffset)) {
          bestOffset = offset

          optionIndex++
        }
        else{
          break
        }
      }

      result.set(node.id, {
        [this.axisPreset.secondaryAxisCoord]: node[this.axisPreset.secondaryAxisCoord] + bestOffset,
        [this.axisPreset.primaryAxisCoord]: placeNextLayerAt
      } as XYPosition)
    }

    return [previousLayerCells, result]
  }

  private scoreLayout(
    [cells, layout]: [NonEmptyArray<LayoutCell>, Map<string, XYPosition>],
    originalRects: Map<string, NodeRect>
  ): [number, NonEmptyArray<LayoutCell>, Map<string, XYPosition>] {
    return [
      pipe(
        layout.entries().toArray(),
        map(([id, position]) => {
          const originalRect = originalRects.get(id)
          invariant(originalRect, `Could not find original rect for node ${id}`)
          return [pick(originalRect, ['x', 'y']), position]
        }),
        map(([original, suggested]) =>
          Math.abs(original![this.axisPreset.secondaryAxisCoord] - suggested![this.axisPreset.secondaryAxisCoord])
        ),
        reduce((a, b) => a + b, 0)
      ),
      cells,
      layout
    ]
  }
}