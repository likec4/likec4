import type { NonEmptyArray, Point } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { edgeLabelAnchor, editedEdgePath, initialControlPoints, viewRouting } from './edge-geometry'

// cubic segments of a real layouted edge, as Graphviz reports them
// (taken from the saved layout of the dev workspace's amazon view)
const spline: NonEmptyArray<Point> = [
  [190, 249],
  [175, 267],
  [163, 288],
  [155, 309],
  [144, 337],
  [148, 368],
  [157, 396],
]

const source = { center: { x: 150, y: 150 }, node: { x: 100, y: 100, width: 100, height: 100 } }
const target = { center: { x: 550, y: 450 }, node: { x: 500, y: 400, width: 100, height: 100 } }
const controlPoints = [{ x: 300, y: 200 }, { x: 400, y: 380 }]

describe('edge-geometry with spline routing', () => {
  it('defaults the view routing to spline', () => {
    expect(viewRouting({})).toBe('spline')
    expect(viewRouting({ routing: 'ortho' })).toBe('ortho')
  })

  it('derives initial control points from the layouted spline', () => {
    expect(initialControlPoints(spline, 'spline')).toMatchInlineSnapshot(`
      [
        {
          "x": 169,
          "y": 277,
        },
        {
          "x": 148,
          "y": 352,
        },
      ]
    `)
  })

  it('draws an edited edge from source to target through its control points', () => {
    expect(editedEdgePath({ source, target, controlPoints, routing: 'spline' })).toMatchInlineSnapshot(
      `"M206,168C234.733,177.479,272.915,179.828,300,200C345.128,233.611,355.892,342.742,400,380C427.228,402.999,465.423,409.541,494,423"`,
    )
  })

  it('draws a back edge from target to source', () => {
    expect(editedEdgePath({ source, target, controlPoints, dir: 'back', routing: 'spline' })).toMatchInlineSnapshot(
      `"M494,394C443.513,343.513,306.682,188.751,300,200C294.534,209.202,406.706,370.297,400,380C392.021,391.545,256.601,247.311,206,201"`,
    )
  })

  it('clips a straight edited edge at both node borders', () => {
    expect(editedEdgePath({ source, target, controlPoints: [], routing: 'spline' })).toMatchInlineSnapshot(
      `"M206,192C273.723,242.792,426.277,357.208,494,408"`,
    )
  })

  it('anchors the label at half the path length', () => {
    const path = {
      getTotalLength: () => 200,
      getPointAtLength: (distance: number) => ({ x: distance, y: distance / 2 + 0.4 }),
    }
    expect(edgeLabelAnchor(path, 'spline')).toEqual({ x: 100, y: 50 })
  })
})
