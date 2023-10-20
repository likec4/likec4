import type { EdgeId, Fqn, Opaque } from '@likec4/core'

export type DotSource = Opaque<string, 'DotSource'>

export type GvNodeName = Opaque<string, 'GvNodeName'>

export type GvId = Opaque<number, 'GvId'>
export type Inches = Opaque<string, 'Inches'>

type Point = [x: number, y: number]

export interface GVPos {
  x: number
  y: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface GraphvizJson {
  name: GvNodeName
  directed: boolean
  strict: boolean
  _draw_: GraphvizJson.Draw[]
  bb: string
  compound: string
  fontname: string
  fontsize: string
  label: string
  nodesep: string
  outputorder: string
  rankdir: string
  ranksep: string
  splines: string
  xdotversion: string
  _subgraph_cnt: number
  objects?: GraphvizJson.GvObject[]
  edges?: GraphvizJson.Edge[]
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GraphvizJson {
  export interface Draw {
    op: string
    grad: string
    color: string
    points: Point[]
  }

  export interface Draw2 {
    op: string
    grad: string
    color: string
    points: Point[]
  }

  export type DrawOps =
    // style
    | {
        op: 'S'
        style: string
      }
    // color
    | {
        op: 'c'
        grad: string
        color: string
      }
    // polygon
    | {
        op: 'p' | 'P'
        points: Point[]
      }
    // bspline
    | {
        op: 'b' | 'B'
        points: Point[]
      }

  export type Ldraw =
    | {
        op: 'F'
        size: number
        face: string
      }
    | {
        op: 'c'
        color: string
      }
    | {
        op: 't'
        fontchar: number
      }
    | {
        op: 'T'
        pt: Point
        align: 'l' | 'r' | 'c'
        width: number
        text: string
      }

  export type GvObject = GvNodeObject | GvSubgraph
  export interface GvSubgraph {
    bb: string
    compound: 'true'
    _ldraw_?: Ldraw[]
    likec4_id?: Fqn
    likec4_level?: number
    likec4_depth?: number
    _gvid: GvId
    nodes: GvId[]
    edges: GvId[]
  }

  export interface GvNodeObject {
    _draw_: Draw[]
    _ldraw_?: Ldraw[]
    likec4_id?: Fqn
    likec4_level?: number
    _gvid: GvId
    height: string
    pos: string
    shape: 'rect'
    width: string
  }

  export interface Draw3 {
    op: string
    grad: string
    color: string
    points: Point[]
  }

  export interface Hdraw {
    op: string
    style: string
    grad: string
    color: string
    points: Point[]
  }

  export interface Edge {
    _gvid: GvId
    tail: number
    head: number
    _draw_: DrawOps[]
    // head arrow
    _hdraw_?: DrawOps[]
    // tail arrow
    _tdraw_?: DrawOps[]
    _ldraw_?: Ldraw[]
    fontname: string
    fontsize: string
    likec4_id?: EdgeId
    label: string
    lp: string
    nojustify?: 'true' | 'false'
    pos?: string
  }
}
