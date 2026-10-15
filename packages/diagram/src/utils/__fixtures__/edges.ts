import type { NonEmptyArray, Point } from '@likec4/core/types'

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
