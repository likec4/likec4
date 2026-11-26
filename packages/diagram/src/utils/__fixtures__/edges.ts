import type { NonEmptyArray, Point } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import type { EdgeEnd } from '../edge-path'
import { edgeEndAtCenter } from '../edge-endpoints'

// cubic segments of a real layouted edge, as Graphviz reports them
// (taken from the saved layout of the dev workspace's amazon view)
export const spline: NonEmptyArray<Point> = [
  [190, 249],
  [175, 267],
  [163, 288],
  [155, 309],
  [144, 337],
  [148, 368],
  [157, 396],
]

// a Graphviz ortho spline: right, then down, with a zero-length cubic and collinear middle points
export const orthoSpline: NonEmptyArray<Point> = [
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

export const source = { center: { x: 150, y: 150 }, node: { x: 100, y: 100, width: 100, height: 100 } }
export const target = { center: { x: 550, y: 450 }, node: { x: 500, y: 400, width: 100, height: 100 } }

const legacySystem = edgeEndAtCenter({ x: 737, y: 1248, width: 348, height: 180 })

/** An edited edge of a saved layout, with the route drawn before the ends followed the corners. */
export type SavedEditedEdge = {
  /** id of the edge in the saved layout */
  id: string
  label: string
  source: EdgeEnd
  target: EdgeEnd
  controlPoints: XYPosition[]
  route: XYPosition[]
}

/** The edited edges of `e2e/src/likec4/.likec4/ortho-routing.likec4.snap`, drawn from source to target. */
export const orthoRoutingEdges: SavedEditedEdge[] = [
  {
    id: '148txyu',
    label: 'reads/writes',
    source: legacySystem,
    target: edgeEndAtCenter({ x: 505, y: 1510, width: 376, height: 180 }),
    controlPoints: [{ x: 805, y: 1464 }],
    route: [{ x: 911, y: 1430 }, { x: 911, y: 1464 }, { x: 805, y: 1464 }, { x: 693, y: 1464 }, { x: 693, y: 1508 }],
  },
  {
    id: '1nbac95',
    label: 'fetches via REST, from the dashboard',
    source: edgeEndAtCenter({ x: 88, y: 310, width: 320, height: 180 }),
    target: legacySystem,
    controlPoints: [{ x: 539, y: 404 }],
    route: [{ x: 410, y: 400 }, { x: 539, y: 400 }, { x: 539, y: 404 }, { x: 539, y: 1338 }, { x: 735, y: 1338 }],
  },
  {
    id: '4yyvxp',
    label: 'fetches via REST, from the mobile app',
    source: edgeEndAtCenter({ x: 518, y: 310, width: 336, height: 180 }),
    target: legacySystem,
    controlPoints: [{ x: 877, y: 863 }],
    route: [{ x: 686, y: 492 }, { x: 686, y: 863 }, { x: 877, y: 863 }, { x: 911, y: 863 }, { x: 911, y: 1246 }],
  },
  {
    id: '1mrbzo2',
    label: 'calls legacy',
    source: edgeEndAtCenter({ x: 89, y: 910, width: 320, height: 180 }),
    target: legacySystem,
    controlPoints: [{ x: 715, y: 989 }],
    route: [{ x: 411, y: 1000 }, { x: 715, y: 1000 }, { x: 715, y: 989 }, { x: 911, y: 989 }, { x: 911, y: 1246 }],
  },
]
