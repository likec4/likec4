import { polylineToSegments } from '@likec4/core/geometry'
import type { NonEmptyArray, Point } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { type SavedEditedEdge, orthoRoutingEdges, orthoSpline, source, spline, target } from './__fixtures__/edges'
import { convertLegacyCorners, initialControlPoints, insertCorner, snapCorner } from './edge-corners'
import { type EdgeEnd, editedEdgeRoute } from './edge-path'

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
  // node centres (150,150) and (550,450)
  const edge = { source, target }

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
      source: { ...source, center: { x: 150.5, y: 150.5 } },
      target,
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
})

describe('corner insertion', () => {
  // nodes 100 x 100 around the centres (150,150) and (550,450)
  const edge = { source, target }

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

  it('inserts on a stretch that follows a corner', () => {
    // the edge leaves the left side 40 below the middle (390) and runs straight to its first corner
    const element = { center: { x: 560, y: 390 }, node: { x: 400, y: 300, width: 320, height: 180 } }
    const far = { center: { x: -350, y: -350 }, node: { x: -400, y: -400, width: 100, height: 100 } }
    const result = insertCorner({
      point: { x: 300, y: 427 },
      controlPoints: [{ x: 200, y: 430 }],
      source: element,
      target: far,
      routing: 'ortho',
    })
    expect(result).toEqual([{ x: 300, y: 430 }, { x: 200, y: 430 }])
  })

  it('inserts the raw point under spline routing, as before', () => {
    const controlPoints = [{ x: 300, y: 200 }]
    const result = insertCorner({ point: { x: 200, y: 172 }, controlPoints, ...edge, routing: 'spline' })
    expect(result).toEqual([{ x: 200, y: 172 }, { x: 300, y: 200 }])
  })

  // 320 x 180 around the centre
  const box = (x: number, y: number): EdgeEnd => ({
    center: { x, y },
    node: { x: x - 160, y: y - 90, width: 320, height: 180 },
  })

  it('keeps the start of the line when the new corner faces a side of the element', () => {
    // the line leaves the middle of the left side and bends up at (200,390) to the corner diagonal to the element
    const ends = { source: box(560, 390), target: box(200, -200) }
    const controlPoints = insertCorner({
      point: { x: 203, y: 340 },
      controlPoints: [{ x: 200, y: 200 }],
      ...ends,
      routing: 'ortho',
    })
    expect(controlPoints).toEqual([{ x: 200, y: 390 }, { x: 200, y: 340 }, { x: 200, y: 200 }])
    expect(editedEdgeRoute({ ...ends, controlPoints })?.points).toEqual([
      { x: 398, y: 390 },
      { x: 200, y: 390 },
      { x: 200, y: 340 },
      { x: 200, y: 200 },
      { x: 200, y: -108 },
    ])
  })

  it('keeps the end of the line when the new corner faces a side of the element', () => {
    const ends = { source: box(200, -200), target: box(560, 390) }
    const controlPoints = insertCorner({
      point: { x: 203, y: 340 },
      controlPoints: [{ x: 200, y: 200 }],
      ...ends,
      routing: 'ortho',
    })
    expect(controlPoints).toEqual([{ x: 200, y: 200 }, { x: 200, y: 340 }, { x: 200, y: 390 }])
    expect(editedEdgeRoute({ ...ends, controlPoints })?.points).toEqual([
      { x: 200, y: -108 },
      { x: 200, y: 200 },
      { x: 200, y: 340 },
      { x: 200, y: 390 },
      { x: 398, y: 390 },
    ])
  })

  it('keeps the line of an edge drawn from its target', () => {
    const controlPoints = insertCorner({
      point: { x: 203, y: 340 },
      controlPoints: [{ x: 200, y: 200 }],
      source: box(200, -200),
      target: box(560, 390),
      dir: 'back',
      routing: 'ortho',
    })
    expect(controlPoints).toEqual([{ x: 200, y: 390 }, { x: 200, y: 340 }, { x: 200, y: 200 }])
  })

  it('keeps the line of an edge without corners', () => {
    // the line runs right from the source and bends down at (600,0) into the target
    const ends = { source: box(0, 0), target: box(600, 400) }
    const controlPoints = insertCorner({ point: { x: 500, y: 3 }, controlPoints: [], ...ends, routing: 'ortho' })
    expect(controlPoints).toEqual([{ x: 500, y: 0 }, { x: 600, y: 0 }])
    expect(editedEdgeRoute({ ...ends, controlPoints })?.points).toEqual([
      { x: 162, y: 0 },
      { x: 500, y: 0 },
      { x: 600, y: 0 },
      { x: 600, y: 308 },
    ])
  })

  it('keeps the bend after a first corner that the start of the line follows', () => {
    // the line runs down from (300,30) and turns at the drawn bend (300,700); a new first corner moves it to (600,30)
    const bent = { source: box(0, 0), target: box(900, 900), controlPoints: [{ x: 300, y: 30 }, { x: 600, y: 700 }] }
    const controlPoints = insertCorner({ ...bent, point: { x: 250, y: 32 }, routing: 'ortho' })
    expect(controlPoints).toEqual([{ x: 250, y: 30 }, { x: 300, y: 30 }, { x: 300, y: 700 }, { x: 600, y: 700 }])
    const before = editedEdgeRoute(bent)!.points
    const after = editedEdgeRoute({ ...bent, controlPoints })!.points
    expect(polylineToSegments(after)).toEqual(polylineToSegments(before))
  })

  it.each(orthoRoutingEdges)('keeps the route of "$label" wherever a corner is inserted', edge => {
    const before = editedEdgeRoute(edge)!.points
    for (let i = 1; i < before.length; i++) {
      const a = before[i - 1]!, b = before[i]!
      const point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const controlPoints = insertCorner({ ...edge, point, routing: 'ortho' })
      const after = editedEdgeRoute({ ...edge, controlPoints })!.points
      expect(polylineToSegments(after), `inserted at (${point.x},${point.y})`).toEqual(polylineToSegments(before))
    }
  })

  it('inserts on a self-loop as before', () => {
    // two corners above the ends of the top side, where neither faces it
    const element = box(560, 390)
    const controlPoints = insertCorner({
      point: { x: 480, y: 203 },
      controlPoints: [{ x: 404, y: 200 }, { x: 716, y: 200 }],
      source: element,
      target: element,
      routing: 'ortho',
    })
    // What the code did before, not what is wanted: the new corner goes first and the loop runs back over
    // itself, because clicks on a self-loop are measured against a line that is not the one drawn.
    expect(controlPoints).toEqual([{ x: 480, y: 200 }, { x: 404, y: 200 }, { x: 716, y: 200 }])
  })
})

describe('conversion of edges saved before the ends followed the corners', () => {
  // 320 x 180, centre (560,390)
  const element = { center: { x: 560, y: 390 }, node: { x: 400, y: 300, width: 320, height: 180 } }
  // far above and left, diagonal to every corner below
  const far = { center: { x: -350, y: -350 }, node: { x: -400, y: -400, width: 100, height: 100 } }
  // one above the other, middles 200 apart sideways
  const upper = { center: { x: 160, y: 90 }, node: { x: 0, y: 0, width: 320, height: 180 } }
  const lower = { center: { x: 360, y: 490 }, node: { x: 200, y: 400, width: 320, height: 180 } }

  it('turns the bend at the start into the first corner', () => {
    // the old route left the middle of the left side and bent at (200,390) to reach the corner
    expect(convertLegacyCorners({ source: element, target: far, controlPoints: [{ x: 200, y: 430 }] })).toEqual([
      { x: 200, y: 390 },
      { x: 200, y: 430 },
    ])
  })

  it('turns the bend at the end into the last corner', () => {
    // the old route went down through the corner and bent at (900,390) to enter the middle of the right side
    const source = { center: { x: 900, y: 50 }, node: { x: 850, y: 0, width: 100, height: 100 } }
    expect(convertLegacyCorners({ source, target: element, controlPoints: [{ x: 900, y: 360 }] })).toEqual([
      { x: 900, y: 360 },
      { x: 900, y: 390 },
    ])
  })

  it('turns one corner that faces both elements into three', () => {
    expect(convertLegacyCorners({ source: upper, target: lower, controlPoints: [{ x: 260, y: 290 }] })).toEqual([
      { x: 160, y: 290 },
      { x: 260, y: 290 },
      { x: 360, y: 290 },
    ])
  })

  it('keeps a corner level with the middle of the side', () => {
    const controlPoints = [{ x: 200, y: 390 }]
    expect(convertLegacyCorners({ source: element, target: far, controlPoints })).toEqual(controlPoints)
  })

  it('keeps a corner diagonal to the element', () => {
    const controlPoints = [{ x: 300, y: 200 }]
    expect(convertLegacyCorners({ source: element, target: far, controlPoints })).toEqual(controlPoints)
  })

  it('converts in drawing order for an edge drawn from its target', () => {
    // drawn from the element: its bend comes first, the bend at the source last
    const source = { center: { x: 560, y: 790 }, node: { x: 400, y: 700, width: 320, height: 180 } }
    const controlPoints = [{ x: 200, y: 430 }, { x: 200, y: 760 }]
    expect(convertLegacyCorners({ source, target: element, dir: 'back', controlPoints })).toEqual([
      { x: 200, y: 390 },
      { x: 200, y: 430 },
      { x: 200, y: 760 },
      { x: 200, y: 790 },
    ])
  })

  const savedEdges: Array<Pick<SavedEditedEdge, 'label' | 'source' | 'target' | 'controlPoints'>> = [
    { label: 'a bend at the start', source: element, target: far, controlPoints: [{ x: 200, y: 430 }] },
    { label: 'one corner facing both elements', source: upper, target: lower, controlPoints: [{ x: 260, y: 290 }] },
    ...orthoRoutingEdges,
  ]

  it.each(savedEdges)('changes nothing when run again on "$label"', edge => {
    const once = convertLegacyCorners(edge)
    expect(convertLegacyCorners({ ...edge, controlPoints: once })).toEqual(once)
  })

  it.each(orthoRoutingEdges)('keeps the route of "$label" from the ortho-routing e2e view', ({ route, ...edge }) => {
    const controlPoints = convertLegacyCorners(edge)
    expect(editedEdgeRoute({ ...edge, controlPoints })?.points).toEqual(route)
  })
})
