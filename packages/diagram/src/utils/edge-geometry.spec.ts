import type { NonEmptyArray, Point } from '@likec4/core'
import type { XYPosition } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { edgeLabelAnchor, editedEdgePath, initialControlPoints, layoutedEdgePath, viewRouting } from './edge-geometry'

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

// --- ortho routing ---

/** splits an SVG path into absolute commands with their numeric arguments */
function commands(d: string): Array<{ op: string; args: number[] }> {
  return [...d.matchAll(/([MLQC])([^MLQC]*)/g)].map(m => ({
    op: m[1]!,
    args: m[2]!.trim().split(/[\s,]+/).filter(Boolean).map(Number),
  }))
}

/** straight (L) segments of a path as [from, to] pairs */
function straightSegments(d: string): Array<[XYPosition, XYPosition]> {
  const result: Array<[XYPosition, XYPosition]> = []
  let current: XYPosition | null = null
  for (const { op, args } of commands(d)) {
    const end = { x: args[args.length - 2]!, y: args[args.length - 1]! }
    if (op === 'L' && current) {
      result.push([current, end])
    }
    current = end
  }
  return result
}

const isAxisAligned = (d: string) => straightSegments(d).every(([a, b]) => a.x === b.x || a.y === b.y)

// a Graphviz ortho spline: right, then down, with a zero-length cubic and collinear middle points
const orthoSpline: NonEmptyArray<Point> = [
  [100, 50],
  [120, 50],
  [140, 50],
  [160, 50],
  [160, 50],
  [160, 50],
  [160, 50],
  [160, 70],
  [160, 90],
  [160, 110],
  [160, 130],
  [160, 150],
  [160, 170],
]

describe('edge-geometry with ortho routing', () => {
  it('takes the corners of an ortho spline as initial control points', () => {
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
    const d = layoutedEdgePath({ points: arc, source, target, routing: 'ortho' })
    expect(isAxisAligned(d)).toBe(true)
    expect(commands(d).some(c => c.op === 'C')).toBe(false)
  })

  it('draws an edited edge with axis-aligned segments through its corners, clipped at the node borders', () => {
    const d = editedEdgePath({ source, target, controlPoints: [{ x: 550, y: 150 }], routing: 'ortho' })
    expect(isAxisAligned(d)).toBe(true)
    // leaves the source box (x 100..200) to the right, with a 2px margin
    expect(commands(d)[0]).toEqual({ op: 'M', args: [202, 150] })
    // enters the target box (y 400..500) from the top, with a 2px margin
    const last = commands(d).at(-1)!
    expect(last.args.slice(-2)).toEqual([550, 398])
  })

  it('inserts one elbow that continues the incoming direction between misaligned corners', () => {
    // corners are diagonal to each other: after the horizontal exit, the elbow must stay horizontal first
    const d = editedEdgePath({
      source,
      target,
      controlPoints: [{ x: 300, y: 150 }, { x: 400, y: 300 }],
      routing: 'ortho',
    })
    expect(isAxisAligned(d)).toBe(true)
    const corners = commands(d).filter(c => c.op === 'Q').map(c => ({ x: c.args[0], y: c.args[1] }))
    expect(corners).toContainEqual({ x: 400, y: 150 })
  })

  it('continues vertically after a vertical segment before turning', () => {
    // exit downwards to the first corner, then the next corner is diagonal: the elbow keeps going down first
    const d = editedEdgePath({
      source,
      target,
      controlPoints: [{ x: 150, y: 300 }, { x: 400, y: 350 }],
      routing: 'ortho',
    })
    expect(isAxisAligned(d)).toBe(true)
    const corners = commands(d).filter(c => c.op === 'Q').map(c => ({ x: c.args[0], y: c.args[1] }))
    expect(corners).toContainEqual({ x: 150, y: 350 })
  })

  it('goes along the larger delta first when leaving the source', () => {
    const d = editedEdgePath({ source, target, controlPoints: [], routing: 'ortho' })
    expect(isAxisAligned(d)).toBe(true)
    // source centre (150,150) to target centre (550,450): dx 400 > dy 300, so exit horizontally
    expect(commands(d)[0]).toEqual({ op: 'M', args: [202, 150] })
  })

  it('draws a back edge from the target', () => {
    const d = editedEdgePath({ source, target, controlPoints: [], dir: 'back', routing: 'ortho' })
    expect(isAxisAligned(d)).toBe(true)
    expect(commands(d)[0]!.op).toBe('M')
    // starts at the target box border (x 500..600), heading left
    expect(commands(d)[0]!.args).toEqual([498, 450])
  })

  it('keeps corners sharp when a segment is too short to round', () => {
    const d = editedEdgePath({
      source,
      target,
      controlPoints: [{ x: 300, y: 150 }, { x: 300, y: 154 }, { x: 400, y: 154 }],
      routing: 'ortho',
    })
    expect(isAxisAligned(d)).toBe(true)
    // the 4px segment can only host 2px arcs: the arc around (300,154) starts within 2px of the corner
    const cmds = commands(d)
    const q = cmds.findIndex(c => c.op === 'Q' && c.args[0] === 300 && c.args[1] === 154)
    expect(q).toBeGreaterThan(0)
    const before = cmds[q - 1]!.args
    expect(Math.hypot(before[0]! - 300, before[1]! - 154)).toBeLessThanOrEqual(2)
  })

  it('renders untouched ortho edges straight from their Graphviz points', () => {
    const d = layoutedEdgePath({ points: orthoSpline, source, target, routing: 'ortho' })
    expect(d.startsWith('M 100,50')).toBe(true)
    expect(commands(d).every(c => c.op === 'M' || c.op === 'C')).toBe(true)
  })

  it('re-routes untouched legacy curved edges orthogonally under ortho routing', () => {
    const d = layoutedEdgePath({ points: spline, source, target, routing: 'ortho' })
    expect(isAxisAligned(d)).toBe(true)
    expect(commands(d).some(c => c.op === 'C')).toBe(false)
  })

  it('keeps untouched spline edges as Bezier paths', () => {
    const d = layoutedEdgePath({ points: spline, source, target, routing: 'spline' })
    expect(commands(d).some(c => c.op === 'C')).toBe(true)
  })
})
