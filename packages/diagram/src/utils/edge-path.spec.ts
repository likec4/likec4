import type { NonEmptyArray, Point } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { orthoSpline, source, spline, target } from './__fixtures__/edges'
import { type DrawnEdge, editedEdgePath, layoutedEdgePath } from './edge-path'

const controlPoints = [{ x: 300, y: 200 }, { x: 400, y: 380 }]

const isAxisAligned = ({ d, segments }: DrawnEdge) =>
  !d.includes('C') && segments.length > 0 && segments.every(([a, b]) => a.x === b.x || a.y === b.y)
/** corners of a path with rounded corners: the control point of every `Q` command */
const roundedCorners = ({ d }: DrawnEdge) => [...d.matchAll(/Q (\d+),(\d+)/g)].map(m => ({ x: +m[1]!, y: +m[2]! }))

describe('edge path with spline routing', () => {
  it('draws an edited edge from source to target through its control points', () => {
    expect(editedEdgePath({ source, target, controlPoints, routing: 'spline' }).d).toMatchInlineSnapshot(
      `"M206,168C234.733,177.479,272.915,179.828,300,200C345.128,233.611,355.892,342.742,400,380C427.228,402.999,465.423,409.541,494,423"`,
    )
  })

  it('draws a back edge from target to source', () => {
    expect(editedEdgePath({ source, target, controlPoints, dir: 'back', routing: 'spline' }).d).toMatchInlineSnapshot(
      `"M494,394C443.513,343.513,306.682,188.751,300,200C294.534,209.202,406.706,370.297,400,380C392.021,391.545,256.601,247.311,206,201"`,
    )
  })

  it('clips a straight edited edge at both node borders', () => {
    expect(editedEdgePath({ source, target, controlPoints: [], routing: 'spline' }).d).toMatchInlineSnapshot(
      `"M206,192C273.723,242.792,426.277,357.208,494,408"`,
    )
  })

  it('keeps untouched spline edges as Bezier paths without straight segments', () => {
    const path = layoutedEdgePath({ points: spline, source, target, routing: 'spline' })
    expect(path.d.includes('C')).toBe(true)
    expect(path.segments).toEqual([])
  })
})

describe('edge path with ortho routing', () => {
  it('draws an edited edge with axis-aligned segments through its corners, clipped at the node borders', () => {
    const path = editedEdgePath({ source, target, controlPoints: [{ x: 550, y: 150 }], routing: 'ortho' })
    expect(isAxisAligned(path)).toBe(true)
    // leaves the source box (x 100..200) to the right, with a 2px margin
    expect(path.d.startsWith('M 202,150')).toBe(true)
    // enters the target box (y 400..500) from the top, with a 2px margin
    expect(path.d.endsWith('L 550,398')).toBe(true)
  })

  it('inserts one elbow that continues the incoming direction between misaligned corners', () => {
    // corners are diagonal to each other: after the horizontal exit, the elbow must stay horizontal first
    const path = editedEdgePath({
      source,
      target,
      controlPoints: [{ x: 300, y: 150 }, { x: 400, y: 300 }],
      routing: 'ortho',
    })
    expect(isAxisAligned(path)).toBe(true)
    expect(roundedCorners(path)).toContainEqual({ x: 400, y: 150 })
  })

  it('continues vertically after a vertical segment before turning', () => {
    // exit downwards to the first corner, then the next corner is diagonal: the elbow keeps going down first
    const path = editedEdgePath({
      source,
      target,
      controlPoints: [{ x: 150, y: 300 }, { x: 400, y: 350 }],
      routing: 'ortho',
    })
    expect(isAxisAligned(path)).toBe(true)
    expect(roundedCorners(path)).toContainEqual({ x: 150, y: 350 })
  })

  it('goes along the larger delta first when leaving the source', () => {
    const path = editedEdgePath({ source, target, controlPoints: [], routing: 'ortho' })
    expect(isAxisAligned(path)).toBe(true)
    // source centre (150,150) to target centre (550,450): dx 400 > dy 300, so exit horizontally
    expect(path.d.startsWith('M 202,150')).toBe(true)
  })

  it('draws a back edge from the target', () => {
    const path = editedEdgePath({ source, target, controlPoints: [], dir: 'back', routing: 'ortho' })
    expect(isAxisAligned(path)).toBe(true)
    // starts at the target box border (x 500..600), heading left
    expect(path.d.startsWith('M 498,450')).toBe(true)
  })

  it('keeps corners sharp when a segment is too short to round', () => {
    const path = editedEdgePath({
      source,
      target,
      controlPoints: [{ x: 300, y: 150 }, { x: 300, y: 154 }, { x: 400, y: 154 }],
      routing: 'ortho',
    })
    expect(isAxisAligned(path)).toBe(true)
    // the 4px segment can only host 2px arcs: the arc around (300,154) starts within 2px of the corner
    const before = /L (\d+),(\d+) Q 300,154/.exec(path.d)
    expect(before).not.toBeNull()
    expect(Math.hypot(+before![1]! - 300, +before![2]! - 154)).toBeLessThanOrEqual(2)
  })

  it('reports the straight pieces between the rounded corners as segments', () => {
    // route: right from the source border (202,150) to (550,150), down to the target border (550,398)
    const path = editedEdgePath({ source, target, controlPoints: [{ x: 550, y: 150 }], routing: 'ortho' })
    expect(path.segments).toEqual([
      [{ x: 202, y: 150 }, { x: 542, y: 150 }],
      [{ x: 550, y: 158 }, { x: 550, y: 398 }],
    ])
  })

  it('draws an edited self-loop as a loop around its corners without retracing', () => {
    const node = { x: 100, y: 100, width: 100, height: 100 }
    const end = { center: { x: 150, y: 150 }, node }
    const path = editedEdgePath({
      source: end,
      target: end,
      controlPoints: [{ x: 118, y: 20 }, { x: 182, y: 20 }],
      routing: 'ortho',
    })
    expect(isAxisAligned(path)).toBe(true)
    expect(path.d.startsWith('M 118,100')).toBe(true)
    expect(path.d.endsWith('L 182,100')).toBe(true)
    // up, across, down: three runs, none of them retraced
    expect(path.segments).toHaveLength(3)
  })

  it('draws a default loop above the node for an edited self-loop without corners', () => {
    const node = { x: 100, y: 100, width: 100, height: 100 }
    const end = { center: { x: 150, y: 150 }, node }
    const path = editedEdgePath({ source: end, target: end, controlPoints: [], routing: 'ortho' })
    expect(isAxisAligned(path)).toBe(true)
    expect(path.segments).toHaveLength(3)
    expect(path.segments.every(([a, b]) => a.y <= 100 && b.y <= 100)).toBe(true)
  })

  it('renders untouched ortho edges straight from their Graphviz points', () => {
    const path = layoutedEdgePath({ points: orthoSpline, source, target, routing: 'ortho' })
    expect(path.d.startsWith('M 100,50')).toBe(true)
    expect(path.d.includes('L')).toBe(false)
    // right 60px, then down 120px: the collinear cubics form one segment each way
    expect(path.segments).toEqual([
      [{ x: 100, y: 50 }, { x: 160, y: 50 }],
      [{ x: 160, y: 50 }, { x: 160, y: 170 }],
    ])
  })

  it('merges a straight run that Graphviz split with a zero-length cubic', () => {
    // right 60px, a zero-length cubic, right 60px more, then down: one horizontal run of 120px
    const points: NonEmptyArray<Point> = [
      [100, 50],
      [120, 50],
      [140, 50],
      [160, 50],
      [160, 50],
      [160, 50],
      [160, 50],
      [180, 50],
      [200, 50],
      [220, 50],
      [220, 70],
      [220, 90],
      [220, 100],
    ]
    const path = layoutedEdgePath({ points, source, target, routing: 'ortho' })
    expect(path.segments).toEqual([
      [{ x: 100, y: 50 }, { x: 220, y: 50 }],
      [{ x: 220, y: 50 }, { x: 220, y: 100 }],
    ])
  })

  it('re-routes untouched legacy curved edges orthogonally under ortho routing', () => {
    expect(isAxisAligned(layoutedEdgePath({ points: spline, source, target, routing: 'ortho' }))).toBe(true)
  })

  it('re-routes an arc between axis-aligned endpoints as legacy curved geometry', () => {
    const arc: NonEmptyArray<Point> = [[100, 100], [150, 40], [250, 40], [300, 100]]
    expect(isAxisAligned(layoutedEdgePath({ points: arc, source, target, routing: 'ortho' }))).toBe(true)
  })
})
