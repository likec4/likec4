import { describe, expect, it } from 'vitest'
import { type TrackRoute, keepOwnTrack, trackedEdgePath } from './edge-tracks'

const pts = (...xy: number[]) => Array.from({ length: xy.length / 2 }, (_, i) => ({ x: xy[i * 2]!, y: xy[i * 2 + 1]! }))
// a box far larger than any route, so the end points are never clamped unless a case sets its own bounds
const anywhere = { x: -1e6, y: -1e6, width: 2e6, height: 2e6 }
const route = (id: string, points: { x: number; y: number }[], movable = true): TrackRoute =>
  movable ? { id, points, movable, bounds: { from: anywhere, to: anywhere } } : { id, points, movable }

describe('keepOwnTrack', () => {
  it('leaves a route alone when no other run shares its track', () => {
    const own = route('a', pts(0, 100, 200, 100, 200, 300))
    const other = route('b', pts(0, 150, 200, 150))
    expect(keepOwnTrack(own, [other])).toEqual(own.points)
  })

  it('moves two edges sharing a horizontal run onto tracks 12 apart, ordered by id', () => {
    const a = route('a', pts(0, 100, 200, 100, 200, 300))
    const b = route('b', pts(50, 100, 300, 100))
    expect(keepOwnTrack(a, [b])).toEqual(pts(0, 94, 200, 94, 200, 300))
    expect(keepOwnTrack(b, [a])).toEqual(pts(50, 106, 300, 106))
  })

  it('moves two edges sharing a vertical run sideways', () => {
    const a = route('a', pts(100, 0, 100, 200))
    const b = route('b', pts(100, 50, 100, 300, 400, 300))
    expect(keepOwnTrack(a, [b])).toEqual(pts(94, 0, 94, 200))
    expect(keepOwnTrack(b, [a])).toEqual(pts(106, 50, 106, 300, 400, 300))
  })

  it('spreads three edges leaving the same node side', () => {
    // all three leave the right side of a box at y 100 and run right before turning
    const a = route('a', pts(102, 100, 300, 100, 300, 0))
    const b = route('b', pts(102, 100, 400, 100, 400, 500))
    const c = route('c', pts(102, 100, 500, 100, 500, 250))
    expect(keepOwnTrack(a, [b, c])[0]).toEqual({ x: 102, y: 88 })
    expect(keepOwnTrack(b, [a, c])[0]).toEqual({ x: 102, y: 100 })
    expect(keepOwnTrack(c, [a, b])[0]).toEqual({ x: 102, y: 112 })
  })

  it('separates a reverse pair drawn in opposite directions', () => {
    const ab = route('ab', pts(102, 100, 398, 100))
    const ba = route('ba', pts(398, 100, 102, 100))
    expect(keepOwnTrack(ab, [ba])).toEqual(pts(102, 94, 398, 94))
    expect(keepOwnTrack(ba, [ab])).toEqual(pts(398, 106, 102, 106))
  })

  it('does not shift runs that only touch at a corner', () => {
    const a = route('a', pts(0, 100, 200, 100))
    const b = route('b', pts(200, 100, 400, 100))
    expect(keepOwnTrack(a, [b])).toEqual(a.points)
  })

  it('keeps an untouched edge where Graphviz put it and moves the edited one off it', () => {
    const fixed = route('auto', pts(0, 100, 300, 100), false)
    const edited = route('edited', pts(50, 100, 250, 100, 250, 300))
    expect(keepOwnTrack(edited, [fixed])).toEqual(pts(50, 112, 250, 112, 250, 300))
    expect(keepOwnTrack(fixed, [edited])).toEqual(fixed.points)
  })

  it('keeps a shifted end point on its node side by limiting the whole run, so the run stays straight', () => {
    // five routes leave a 40px tall box (y 80..120) from its right side at the centre line
    const others = ['a', 'b', 'c', 'd'].map((id, i) => route(id, pts(102, 100, 360 + i * 40, 100, 360 + i * 40, 250)))
    const bounds = { from: { x: 0, y: 80, width: 100, height: 40 }, to: { x: 300, y: 380, width: 100, height: 40 } }
    const shifted = keepOwnTrack({ id: 'e', points: pts(102, 100, 300, 100, 300, 400), movable: true, bounds }, others)
    // e is last by id: +24 would leave the side, the run is limited to the inset
    expect(shifted[0]).toEqual({ x: 102, y: 112 })
    expect(shifted[1]).toEqual({ x: 300, y: 112 })
  })

  it('gives every member of a chain of overlapping runs its own track', () => {
    // a overlaps b, b overlaps c, c overlaps d, but a and d do not overlap
    const a = route('a', pts(0, 100, 150, 100))
    const b = route('b', pts(100, 100, 250, 100))
    const c = route('c', pts(200, 100, 350, 100))
    const d = route('d', pts(300, 100, 450, 100))
    const all = [a, b, c, d]
    const ys = all.map(r => keepOwnTrack(r, all.filter(o => o !== r))[0]!.y)
    expect(ys).toEqual([82, 94, 106, 118])
  })

  it('shifts a run split by a collinear corner as a whole', () => {
    const a = route('a', pts(0, 100, 100, 100, 200, 100, 200, 300))
    const b = route('b', pts(150, 100, 400, 100))
    expect(keepOwnTrack(a, [b])).toEqual(pts(0, 94, 100, 94, 200, 94, 200, 300))
  })

  it('bounds a back edge by the nodes in drawing order', () => {
    const source = { center: { x: 50, y: 30 }, node: { x: 0, y: 0, width: 100, height: 60 } }
    const target = { center: { x: 50, y: 330 }, node: { x: 0, y: 300, width: 100, height: 60 } }
    // drawn from the target upwards, sharing its first run with another route
    const other = route('other', pts(50, 298, 50, 62))
    const drawn = trackedEdgePath({
      id: 'back',
      source,
      target,
      dir: 'back',
      controlPoints: [],
      routing: 'ortho',
      others: [other],
    })
    // moved sideways by one track and still leaving the target box, not yanked into the source box
    expect(drawn.segments[0]![0]).toEqual({ x: 44, y: 298 })
    expect(drawn.segments[0]![1]).toEqual({ x: 44, y: 62 })
  })
})
