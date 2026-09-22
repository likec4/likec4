import { BBox } from '@likec4/core/geometry'
import type { DiagramEdge, EdgeId, NodeId, NonEmptyArray, Point } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { placeEdgeLabels } from './place-edge-label'

const node = (x: number, y: number, children: NodeId[] = []) => ({ x, y, width: 100, height: 60, children })
const label = { width: 40, height: 16 }
// a Graphviz ortho spline: right 200, then down 400
const lShaped: NonEmptyArray<Point> = [[100, 30], [150, 30], [250, 30], [300, 30], [300, 130], [300, 330], [300, 430]]

const placeEdgeLabel = <E extends Pick<DiagramEdge, 'points' | 'labelBBox'>>(
  edge: E,
  nodes: ReturnType<typeof node>[],
) => placeEdgeLabels([{ ...edge, id: 'edge' as EdgeId }], nodes)[0]!

describe('placeEdgeLabels', () => {
  it('keeps neighbouring relationship labels separate', () => {
    const edges = [100, 120].map(x => ({
      id: String(x) as EdgeId,
      points: [[x, 0], [x, 100], [x, 200], [x, 300]] as NonEmptyArray<Point>,
      labelBBox: { x: 0, y: 0, width: 100, height: 20 },
    }))
    const placed = placeEdgeLabels(edges, [])
    expect(BBox.intersects(placed[0]!.labelBBox, placed[1]!.labelBBox)).toBe(false)
  })

  it('keeps the cloud example labels off each other and the crossing route', () => {
    const edges = [{
      id: 'calls-legacy' as EdgeId,
      points: [[1878, 550], [1970, 550], [2067, 550], [2067, 550], [2067, 550], [2067, 320], [2067, 320]],
      labelBBox: { x: 2071, y: 426, width: 76, height: 18 },
    }, {
      id: 'aws-sdk' as EdgeId,
      points: [[1718, 490], [1718, 462], [1718, 439], [1718, 439], [1718, 439], [2576, 439], [2576, 439]],
      labelBBox: { x: 2111, y: 394, width: 73, height: 41 },
    }] satisfies Array<{ id: EdgeId; points: NonEmptyArray<Point>; labelBBox: BBox }>
    const [legacy, aws] = placeEdgeLabels(edges, [])
    expect(BBox.intersects(legacy!.labelBBox, aws!.labelBBox)).toBe(false)
    expect(BBox.intersects(legacy!.labelBBox, { x: 1718, y: 438, width: 858, height: 2 })).toBe(false)
    expect(BBox.intersects(aws!.labelBBox, { x: 2066, y: 320, width: 2, height: 230 })).toBe(false)
  })

  it('leaves an edge without a label alone', () => {
    const edge = { id: 'edge' as EdgeId, points: lShaped, labelBBox: null }
    expect(placeEdgeLabels([edge], [])[0]).toBe(edge)
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
