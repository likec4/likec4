import type { NodeId, NonEmptyArray, Point } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { placeEdgeLabel } from './place-edge-label'

const node = (x: number, y: number, children: NodeId[] = []) => ({ x, y, width: 100, height: 60, children })
const label = { width: 40, height: 16 }
// a Graphviz ortho spline: right 200, then down 400
const lShaped: NonEmptyArray<Point> = [[100, 30], [150, 30], [250, 30], [300, 30], [300, 130], [300, 330], [300, 430]]

describe('placeEdgeLabel', () => {
  it('leaves an edge without a label alone', () => {
    const edge = { points: lShaped, labelBBox: null }
    expect(placeEdgeLabel(edge, [])).toBe(edge)
  })

  it('puts the label above the middle of a straight horizontal edge', () => {
    const edge = {
      points: [[100, 30], [200, 30], [300, 30], [400, 30]] as NonEmptyArray<Point>,
      labelBBox: { x: 0, y: 0, ...label },
    }
    expect(placeEdgeLabel(edge, []).labelBBox).toEqual({ x: 230, y: 10, ...label })
  })

  it('puts the label beside the longest run of an L-shaped edge, not on the bend', () => {
    const edge = { points: lShaped, labelBBox: { x: 280, y: 22, ...label } }
    expect(placeEdgeLabel(edge, []).labelBBox).toEqual({ x: 304, y: 222, ...label })
  })

  it('keeps the label off a leaf node the route passes', () => {
    const passed = node(310, 200) // right of the vertical run, where the label would go
    const edge = { points: lShaped, labelBBox: { x: 0, y: 0, ...label } }
    const placed = placeEdgeLabel(edge, [passed]).labelBBox!
    // the other side of the line is free
    expect(placed).toEqual({ x: 256, y: 222, ...label })
  })

  it('ignores compound nodes', () => {
    const compound = node(0, 0, ['child' as NodeId])
    compound.width = 1000
    compound.height = 1000
    const edge = { points: lShaped, labelBBox: { x: 0, y: 0, ...label } }
    expect(placeEdgeLabel(edge, [compound]).labelBBox).toEqual({ x: 304, y: 222, ...label })
  })
})
