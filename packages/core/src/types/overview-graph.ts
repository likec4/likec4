import type { NonEmptyArray, Point, XYPoint } from './_common'
import type { BBox, ViewID } from './view'

/**
 * OverviewGraph is a graph representation of all views in a model
 */
export namespace OverviewGraph {
  export type Node = {
    id: string
    type: 'folder' | 'file'
    path: string
    label: string
    parentId: string | null
    position: XYPoint
    width: number
    height: number
  } | {
    id: string
    type: 'view'
    viewId: ViewID
    label: string
    parentId: string | null
    position: XYPoint
    width: number
    height: number
  }

  /**
   * Edge represents a navigational link from one view to another
   */
  export type Edge = {
    id: string
    source: string
    target: string
    points: NonEmptyArray<Point>
  }
}

export interface OverviewGraph {
  nodes: OverviewGraph.Node[]
  edges: OverviewGraph.Edge[]
  bounds: BBox
}
