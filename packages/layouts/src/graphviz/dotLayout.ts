import type { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedView, DiagramEdge, DiagramNode, DiagramView, NodeId, Point } from '@likec4/core/types'
import { propEq } from 'rambdax'
import invariant from 'tiny-invariant'
import type { DiagramLayoutFn } from '../types'
import type { GVBox, GVPos, GraphvizJson } from './graphviz-types'
import { inchToPx, pointToPx } from './graphviz-utils'
import { printToDot } from './printToDot'

async function loadGraphviz() {
  const { Graphviz } = await import('@hpcc-js/wasm/graphviz')
  const graphviz = await Graphviz.load()
  return graphviz
}


function parseBB(bb?: string): GVBox {
  const [llx, lly, urx, ury] = bb ? bb.split(',').map(p => pointToPx(+p)) as [number, number, number, number] : [0, 0, 0, 0]
  const width = Math.ceil(urx - llx)
  const height = Math.ceil(lly - ury)
  return {
    // x: llx - width / 2,
    // y: lly - height / 2,
    x: Math.ceil(llx),
    y: Math.ceil(ury),
    width,
    height
  }
}

function parsePos(pos: string): GVPos {
  const [x, y] = pos.split(',') as [string, string]
  return {
    x: pointToPx(+x),
    y: pointToPx(+y)
  }
}

function parseNode({ pos, width, height }: GraphvizJson.GvObject): GVBox {
  // const cpos = parsePos(posStr, page)
  const { x, y } = parsePos(pos)
  const w = inchToPx(+width)
  const h = inchToPx(+height)
  return {
    // x: llx - width / 2,
    // y: lly - height / 2,
    x: x - w / 2,
    y: y - h / 2,
    width: w,
    height: h
  }
}

function parseEdgePoints({ _draw_ }: GraphvizJson.Edge): DiagramEdge['points'] {
  const b = _draw_.find(propEq('op', 'b'))
  invariant(b, 'edge should have a bezier curve')
  return b.points.map(([x, y]) => [pointToPx(x), pointToPx(y)])
}

// function parseEdgeHeadPolygon({ _hdraw_ }: GraphvizJson.Edge): DiagramEdge['headPolygon'] {
//   const p = _hdraw_?.find(propEq('op', 'P'))
//   if (p) {
//     return p.points.map(([x, y]) => [pointToPx(x), pointToPx(y)])
//   }
//   return undefined
// }

function textAlignment(align?: string) {
  if (!align)
    return 'left'

  switch (align) {
    case 'l': return 'left'
    case 'r': return 'right'
    case 'c': return 'center'
    default:
      throw new Error(`Unknown text alignment ${align}`)
  }
}

function layout(graphviz: Graphviz, computedView: ComputedView): DiagramView {
  const dotSource = printToDot(computedView)
  const {
    nodes: computedNodes,
    edges: computedEdges,
    ...view
  } = computedView

  const rawjson = graphviz.dot(dotSource, 'json', {
    yInvert: true,
  })

  const graphvizJson = JSON.parse(rawjson) as GraphvizJson

  const pageBBox = parseBB(graphvizJson.bb)

  const diagram: DiagramView = {
    ...view,
    width: pageBBox.width,
    height: pageBBox.height,
    nodes: [],
    edges: []
  }

  const diagramNodes = new Map<NodeId, DiagramNode>()
  for (const computedNd of computedNodes) {
    const n = graphvizJson.objects?.find(o => o.id === computedNd.id)
    invariant(n, `Node ${computedNd.id} not found in graphviz output`)
    const bb = n.nodes ? parseBB(n.bb) : parseNode(n)
    const parent = computedNd.parent ? diagramNodes.get(computedNd.parent) : undefined
    const position: Point = [bb.x, bb.y]

    const relative: Point = parent ? [
      position[0] - parent.position[0],
      position[1] - parent.position[1]
    ] : position
    const node: DiagramNode = {
      ...computedNd,
      // title: n.label.replaceAll('\\n', '\n'),
      position,
      relative,
      size: { width: bb.width, height: bb.height }
    }
    diagramNodes.set(computedNd.id, node)
    diagram.nodes.push(node)
  }

  const graphvizEdges = graphvizJson.edges ?? []

  for (const e of graphvizEdges) {
    const edgeData = computedEdges.find(i => i.id === e.id)
    invariant(edgeData, `Edge ${e.id} not found, how did it get into the graphviz output?`)
    const edge: DiagramEdge = {
      ...edgeData,
      points: parseEdgePoints(e),
      labelBox: null,
    }
    diagram.edges.push(edge)
    // const headPolygon = parseEdgeHeadPolygon(e)
    // if (headPolygon) {
    //   edge.headPolygon = headPolygon
    // }
    const ldraw = (e._ldraw_ ?? e._tldraw_)?.find(l => l.op === 'T')
    if (ldraw && edge.label) {
      const [x, y] = ldraw.pt.map(pointToPx) as Point
      invariant(ldraw.width, 'edge label should have a width')
      const width = pointToPx(ldraw.width)
      const align = textAlignment(ldraw.align)
      edge.labelBox = {
        x: align === 'left' ? x + 4 : x,
        y,
        width,
        align,
      }
    }
  }

  return diagram
}

export const dotLayout: DiagramLayoutFn = async (computedView) => {
  const graphviz = await loadGraphviz()
  return layout(graphviz, computedView)
}

export async function dotLayouter(): Promise<DiagramLayoutFn> {
  const graphviz = await loadGraphviz()
  return (computedView) => new Promise<DiagramView>((resolve, reject) => {
    try {
      resolve(layout(graphviz, computedView))
    } catch (e) {
      reject(e)
    }
  })
}
