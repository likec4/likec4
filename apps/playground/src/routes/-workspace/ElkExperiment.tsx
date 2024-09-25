import { addEdge, Panel, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react'
import { curveLinear, line as d3line } from 'd3-shape'
import ELK, { type ElkExtendedEdge, type ElkNode, type ElkPoint, type ElkPort } from 'elkjs/lib/elk.bundled.js'
import { useCallback, useLayoutEffect } from 'react'

import '@xyflow/react/dist/style.css'
import { type DiagramEdge, type DiagramNode, type DiagramView, type Fqn, nonNullable } from '@likec4/core'
import { useUpdateEffect } from '@likec4/diagram'
import type { Edge as XYFlowEdge, EdgeProps, Node as XYFlowNode } from '@xyflow/react'
import { flatMap, map, pipe } from 'remeda'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'

const elk = new ELK({
  defaultLayoutOptions: {
    // 'edgeRouting': 'SPLINES',
    'edgeRouting': 'POLYLINE',
    'spacing.nodeNode': '80',
    // 'spacing.nodeNodeBetweenLayers': '60',
    'spacing.edgeNode': '30',
    'spacing.edgeNodeBetweenLayers': '20'
    // 'spacing.edgeEdge': '20',
    // 'spacing.edgeEdgeBetweenLayers': '30'
  }
})

// Elk has a *huge* amount of options to configure. To see everything you can
// tweak check out:
//
// - https://www.eclipse.org/elk/reference/algorithms.html
// - https://www.eclipse.org/elk/reference/options.html
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.baseValue': '2',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
}

// type ELKNd = Omit<ElkNode, 'children'> & Pick<XYFlowNode, 'data'> & {
//   children?: ELKNd[]
// }

const getLayoutedElements = ({ nodes, edges }: DiagramView) => {
  const nodeLookup = new Map<string, ElkPoint>()

  const flattenElkGraph = (graph: ElkNode, offset?: ElkPoint & { id: string }): XYFlowNode[] => {
    const node = nonNullable(nodes.find((n) => n.id === graph.id), `Node not found: ${graph.id}`)
    const xynode: XYFlowNode = {
      id: graph.id,
      data: {
        label: node.title
      },
      position: {
        x: graph.x!, // - (parent?.x ?? 0),
        y: graph.y! // - (parent?.y ?? 0)
      },
      width: graph.width!,
      height: graph.height!
    }
    const absolute = {
      id: graph.id,
      x: graph.x! + (offset?.x ?? 0),
      y: graph.y! + (offset?.y ?? 0)
    }
    nodeLookup.set(graph.id, absolute)
    if (offset) {
      xynode.parentId = offset.id
    }
    if (graph.children && graph.children.length > 0) {
      xynode.type = 'group'
      return [xynode, ...graph.children.flatMap((child) => flattenElkGraph(child, absolute))]
    }
    return [xynode]
  }

  // const isHorizontal = options?.['elk.direction'] === 'RIGHT'

  // const parentNode = (id: Fqn | null) => id ? nonNullable(nodeLookup.get(id), `Node not found: ${id}`) : graph

  const toELkNode = (node: DiagramNode): ElkNode => {
    const isLeaf = node.children.length === 0

    const directIn = edges.filter((e) => e.target === node.id)
    const directOut = edges.filter((e) => e.source === node.id)

    return {
      id: node.id,
      ...(isLeaf && {
        width: node.width,
        height: node.height
      }),
      ports: [
        // {
        //   id: node.id,
        //   height: 1,
        //   width: 1
        // },
        ...directIn.map((e): ElkPort => ({
          id: `${node.id}-${e.id}`,
          height: 1,
          width: 1,
          layoutOptions: {
            // side: 'NORTH'
          }
        })),
        ...directOut.map((e): ElkPort => ({
          id: `${node.id}-${e.id}`,
          height: 1,
          width: 1,
          layoutOptions: {
            // side: 'SOUTH'
          }
        }))
      ],
      children: isLeaf ? [] : nodes.filter((n) => n.parent === node.id).map(toELkNode),
      // edges: edges.filter(e => e.parent === node.id).map(toELkEdge),
      layoutOptions: !isLeaf
        ? {
          // 'elk.portConstraints': 'FIXED_ORDER',
          // 'elk.portAlignment.north': 'DISTRIBUTED',
          'elk.padding': '[top=60.0,left=30.0,bottom=30.0,right=30.0]'
          // 'elk.layered.spacing.baseValue': '20',
          // 'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
        }
        : {
          // 'elk.portAlignment.north': 'DISTRIBUTED',
          'elk.portConstraints': 'FREE'
        }
    }
  }

  const toELkEdge = (edge: DiagramEdge): ElkExtendedEdge => {
    return {
      id: edge.id,
      sources: [`${edge.source}-${edge.id}`],
      targets: [`${edge.target}-${edge.id}`]
    }
  }

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.padding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]',
      'hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.direction': 'DOWN',
      'partitioning.activate': 'true'
      // 'edgeRouting': 'POLYLINE',
      // 'spacing.nodeNode': '80'
      // 'spacing.nodeNodeBetweenLayers': '60',
      // 'spacing.edgeNode': '30',
      // 'spacing.edgeNodeBetweenLayers': '20',
      // 'spacing.edgeEdge': '20',
      // 'spacing.edgeEdgeBetweenLayers': '30'
    },
    children: nodes.filter((n) => !n.parent).map(toELkNode),
    // children: nodes.map((node): ElkNode => ({
    //   id: node.id,
    //   // @ts-ignore
    //   data: node.data,

    //   // ports
    //   // Adjust the target and source handle positions based on the layout
    //   // direction.
    //   // targetPosition: isHorizontal ? 'left' : 'top',
    //   // sourcePosition: isHorizontal ? 'right' : 'bottom',
    //   x: 0,
    //   y: 0,

    //   // Hardcode a width and height for elk to use when layouting.
    //   width: node.width,
    //   height: node.height,
    // })),
    edges: edges.map(toELkEdge)
  }

  console.log('graph', graph)

  // for (const node of nodes) {
  //   const parent = parentNode(node.parent)
  //   const elkNode: ELKNd = {
  //     id: node.id,
  //     width: node.width,
  //     height: node.height,
  //     data: {
  //       label: node.title
  //     },
  //     children: [],
  //     edges: []
  //   }
  //   parent.children!.push(elkNode)
  // }

  return elk
    .layout(graph)
    .then((layoutedGraph) => {
      const nodes = layoutedGraph.children!.flatMap((child) => flattenElkGraph(child as any))
      return ({
        nodes,
        edges: layoutedGraph.edges!.map((elkEdge): XYFlowEdge => {
          const edge = edges.find((e) => e.id === elkEdge.id)
          if (!edge) {
            throw new Error(`Edge not found: ${elkEdge.id}`)
          }
          const container = nodeLookup.get((elkEdge as any).container ?? 'root')
          const offsetX = container?.x ?? 0
          const offsetY = container?.y ?? 0
          const points = pipe(
            elkEdge.sections!,
            flatMap(section => [
              section.startPoint,
              ...(section.bendPoints || []),
              section.endPoint
            ]),
            map((point) => ({
              x: point.x + offsetX,
              y: point.y + offsetY
            }))
          )
          // const points = elkEdge.sections!.flatMap(section => [
          //   section.startPoint,
          //   ...(section.bendPoints || []),
          //   section.endPoint
          // ])
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'elk',
            data: {
              points
            }
          }
        })
      })
    })
  // .catch(console.error)
}

const edgeTypes = {
  elk: ElkEdgeType
}

const curve = d3line<ElkPoint>()
  .curve(curveLinear)
  .x(d => d.x)
  .y(d => d.y)

function ElkEdgeType({ id, data }: Omit<EdgeProps, 'data'> & { data: { points: ElkPoint[] } }) {
  // const points = data.sections!.flatMap(section => [
  //   section.startPoint,
  //   ...(section.bendPoints || []),
  //   section.endPoint
  // ])

  const edgePath = curve(data.points)!
  // const sourceNode = useInternalNode(source);
  // const targetNode = useInternalNode(target);

  // if (!sourceNode || !targetNode) {
  //   return null;
  // }

  // const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
  //   sourceNode,
  //   targetNode,
  // );

  // const [edgePath] = getBezierPath({
  //   sourceX: sx,
  //   sourceY: sy,
  //   sourcePosition: sourcePos,
  //   targetPosition: targetPos,
  //   targetX: tx,
  //   targetY: ty,
  // });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      // markerEnd={markerEnd}
      // style={style}
    />
  )
}

function LayoutFlow({ view }: { view: DiagramView }) {
  // const initial = diagramViewToXYFlowData(view)

  const [nodes, setNodes, onNodesChange] = useNodesState([] as XYFlowNode[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as XYFlowEdge[])
  const { fitView } = useReactFlow()

  // /
  const onLayout = useCallback(
    (view: DiagramView) => {
      // const opts = { 'elk.direction': direction, ...elkOptions }
      // const {
      //   xynodes,
      //   xyedges
      // } = diagramViewToXYFlowData(view)

      getLayoutedElements(view).then((res) => {
        setNodes(res.nodes)
        setEdges(res.edges)

        window.requestAnimationFrame(() => fitView())
      })
    },
    []
  )

  // Calculate the initial layout on mount.
  useLayoutEffect(() => {
    onLayout(view)
  }, [])

  useUpdateEffect(() => {
    onLayout(view)
  }, [view])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      edgeTypes={edgeTypes}
      // onConnect={onConnect}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    >
      {
        /* <Panel position="top-right">
        <button onClick={() => onLayout('DOWN')}>
          vertical layout
        </button>

        <button onClick={() => onLayout('RIGHT')}>
          horizontal layout
        </button>
      </Panel> */
      }
    </ReactFlow>
  )
}

export default (props: { view: DiagramView }) => (
  <ReactFlowProvider>
    <LayoutFlow view={props.view} />
  </ReactFlowProvider>
)
