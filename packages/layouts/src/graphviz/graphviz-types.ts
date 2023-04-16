import type { EdgeId, NodeId, Opaque } from '@likec4/core/types'

export type DotSource = Opaque<string, 'DotSource'>

export type GvNodeName = Opaque<string, 'GvNodeName'>

export type GvId = Opaque<number, 'GvId'>
export type Inches = Opaque<string, 'Inches'>

type Point = [x: number, y: number]

export interface GVPos {
  x: number
  y: number
}

export interface GVBox {
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

  export interface Ldraw {
    op: string
    size: number
    face: string
    grad: string
    color: string
    pt: Point
    align: string
    width?: number
    text: string
  }

  export interface GvObject {
    name: GvNodeName
    _draw_: Draw2[]
    _ldraw_?: Ldraw[]
    bb: string
    compound: 'true' | 'false'
    fontname: string
    fontsize: string
    id: NodeId
    label: string
    labeljust: string
    lheight: string
    lp: string
    lwidth: string
    nodesep: string
    outputorder: string
    rankdir: string
    ranksep: string
    splines: string
    _gvid: GvId
    nodes?: GvId[]
    edges?: GvId[]
    height: string
    pos: string
    shape: string
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

  export interface Ldraw2 {
    op: string
    size: number
    face: string
    grad: string
    color: string
    pt: Point
    align: string
    width?: number
    text: string
  }

  export interface Edge {
    _gvid: GvId
    tail: number
    head: number
    _draw_: Draw3[]
    _hdraw_?: Hdraw[]
    _ldraw_?: Ldraw2[]
    _tldraw_?: Ldraw2[]
    fontname: string
    fontsize: string
    id: EdgeId
    label: string
    lp: string
    nojustify?: 'true' | 'false'
    pos?: string
  }
}
