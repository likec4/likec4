import type { NonEmptyArray, Point } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { orthoSpline, spline } from './__fixtures__/edges'
import { initialControlPoints, insertCorner, snapCorner } from './edge-corners'

describe('initial control points', () => {
  it('derives handles from the layouted spline under spline routing', () => {
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

  it('takes the corners of an ortho spline under ortho routing', () => {
    expect(initialControlPoints(orthoSpline, 'ortho')).toEqual([{ x: 160, y: 50 }])
  })

  it('uses the midpoint of a straight ortho edge as its only handle', () => {
    const straight: NonEmptyArray<Point> = [[100, 50], [100, 100], [100, 150], [100, 200]]
    expect(initialControlPoints(straight, 'ortho')).toEqual([{ x: 100, y: 125 }])
  })

  it('keeps the spline handles for legacy curved points under ortho routing', () => {
    expect(initialControlPoints(spline, 'ortho')).toEqual(initialControlPoints(spline, 'spline'))
  })

  it('treats an arc between axis-aligned endpoints as legacy curved geometry', () => {
    const arc: NonEmptyArray<Point> = [[100, 100], [150, 40], [250, 40], [300, 100]]
    expect(initialControlPoints(arc, 'ortho')).toEqual(initialControlPoints(arc, 'spline'))
  })
})

describe('corner editing', () => {
  const from = { x: 150, y: 150 }
  const to = { x: 550, y: 450 }
  const edge = { source: from, target: to }

  it('snaps a dragged corner to the axis of a neighbouring corner within tolerance', () => {
    const controlPoints = [{ x: 300, y: 150 }, { x: 300, y: 300 }, { x: 500, y: 300 }]
    // the middle corner drifts 5px right and 3px down while dragging
    const snapped = snapCorner({ index: 1, point: { x: 305, y: 303 }, controlPoints, ...edge, routing: 'ortho' })
    expect(snapped).toEqual({ x: 300, y: 300 })
  })

  it('snaps the end corners to the node centres', () => {
    const controlPoints = [{ x: 300, y: 150 }]
    expect(snapCorner({ index: 0, point: { x: 300, y: 157 }, controlPoints, ...edge, routing: 'ortho' })).toEqual({
      x: 300,
      y: 150,
    })
  })

  it('leaves a corner alone beyond the tolerance, so an elbow appears', () => {
    const controlPoints = [{ x: 300, y: 150 }, { x: 300, y: 300 }]
    expect(snapCorner({ index: 1, point: { x: 320, y: 300 }, controlPoints, ...edge, routing: 'ortho' })).toEqual({
      x: 320,
      y: 300,
    })
  })

  it('does not snap under spline routing', () => {
    const controlPoints = [{ x: 300, y: 150 }, { x: 300, y: 300 }]
    expect(snapCorner({ index: 1, point: { x: 305, y: 303 }, controlPoints, ...edge, routing: 'spline' })).toEqual({
      x: 305,
      y: 303,
    })
  })

  it('snaps an end corner to a fractional node centre as an integer', () => {
    const result = snapCorner({
      index: 0,
      point: { x: 300, y: 154 },
      controlPoints: [{ x: 300, y: 154 }],
      source: { x: 150.5, y: 150.5 },
      target: to,
      routing: 'ortho',
    })
    expect(result).toEqual({ x: 300, y: 150 })
  })

  it('reads the ends in drawing order for a back edge', () => {
    // drawn from the target: the first corner snaps to the target centre's y
    const result = snapCorner({
      index: 0,
      point: { x: 400, y: 455 },
      controlPoints: [{ x: 400, y: 455 }],
      ...edge,
      dir: 'back',
      routing: 'ortho',
    })
    expect(result).toEqual({ x: 400, y: 450 })
  })

  it('inserts a corner projected onto the segment it was clicked on', () => {
    // route: from (150,150) right to (300,150), down to (300,300), right to (550,300), down to (550,450)
    const controlPoints = [{ x: 300, y: 150 }, { x: 300, y: 300 }, { x: 550, y: 300 }]
    const result = insertCorner({ point: { x: 420, y: 306 }, controlPoints, ...edge, routing: 'ortho' })
    expect(result).toEqual([{ x: 300, y: 150 }, { x: 300, y: 300 }, { x: 420, y: 300 }, { x: 550, y: 300 }])
  })

  it('inserts a corner on an elbow leg between two corners that do not share an axis', () => {
    // corners (300,150) and (400,300): the elbow is at (400,150); clicking the vertical leg inserts between them
    const controlPoints = [{ x: 300, y: 150 }, { x: 400, y: 300 }]
    const result = insertCorner({ point: { x: 404, y: 220 }, controlPoints, ...edge, routing: 'ortho' })
    expect(result).toEqual([{ x: 300, y: 150 }, { x: 400, y: 220 }, { x: 400, y: 300 }])
  })

  it('inserts the raw point under spline routing, as before', () => {
    const controlPoints = [{ x: 300, y: 200 }]
    const result = insertCorner({ point: { x: 200, y: 172 }, controlPoints, ...edge, routing: 'spline' })
    expect(result).toEqual([{ x: 200, y: 172 }, { x: 300, y: 200 }])
  })
})
