import { nonexhaustive } from '@likec4/core'
import type { InternalNode, Rect, XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { sortBy } from 'remeda'

export type DistributionMode = 'Horizontal' | 'Vertical'

export type NodeRect = Rect & { id: string }

export abstract class Distributor {
  abstract computeLayout(nodes: NodeRect[]): void
  abstract applyPosition(node: NodeRect): Partial<XYPosition>
}

/**
 * Distributes nodes along a single axis, keeping the outermost edges in place
 * and equalizing the gaps between consecutive nodes.
 */
abstract class AxisDistributor extends Distributor {
  private positions: Map<string, number> = new Map()

  constructor(
    private axisCoord: 'x' | 'y',
    private axisDimension: 'width' | 'height',
  ) {
    super()
  }

  override computeLayout(nodes: NodeRect[]): void {
    this.positions = new Map()
    // With less than 3 nodes the outermost edges are already fixed, nothing to distribute
    if (nodes.length < 3) {
      return
    }

    const coord = this.axisCoord
    const dimension = this.axisDimension

    const sorted = sortBy(
      nodes,
      n => n[coord] + n[dimension] / 2,
      n => n[coord],
    )

    const start = Math.min(...sorted.map(n => n[coord]))
    const end = Math.max(...sorted.map(n => n[coord] + n[dimension]))
    const occupiedSpace = sorted.reduce((acc, n) => acc + n[dimension], 0)
    const gap = (end - start - occupiedSpace) / (sorted.length - 1)

    let position = start
    for (const node of sorted) {
      this.positions.set(node.id, Math.round(position))
      position += node[dimension] + gap
    }
  }

  override applyPosition(node: NodeRect): Partial<XYPosition> {
    const position = this.positions.get(node.id)
    if (position === undefined) {
      return {}
    }
    return {
      [this.axisCoord]: position,
    }
  }
}

export class HorizontalDistributor extends AxisDistributor {
  constructor() {
    super('x', 'width')
  }
}

export class VerticalDistributor extends AxisDistributor {
  constructor() {
    super('y', 'height')
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

export function getDistributer(mode: DistributionMode): Distributor {
  switch (mode) {
    case 'Horizontal':
      return new HorizontalDistributor()
    case 'Vertical':
      return new VerticalDistributor()
    default:
      nonexhaustive(mode)
  }
}
