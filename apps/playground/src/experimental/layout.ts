import ELK, { type ElkExtendedEdge, type ElkNode, type ElkPoint, type ElkPort } from 'elkjs/lib/elk.bundled.js'

import { type DiagramEdge, type DiagramNode, type DiagramView, nonNullable } from '@likec4/core'
import '@xyflow/react/dist/style.css'
import { flatMap, hasAtLeast, map, pipe } from 'remeda'

const elk = new ELK({
  defaultLayoutOptions: {
    // 'edgeRouting': 'SPLINES',
    'edgeRouting': 'POLYLINE',
    'spacing.nodeNode': '80',
    // 'spacing.nodeNodeBetweenLayers': '60',
    'spacing.edgeNode': '30',
    'spacing.edgeNodeBetweenLayers': '20',
    // 'spacing.edgeEdge': '20',
    // 'spacing.edgeEdgeBetweenLayers': '30'
  },
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
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
}

// type ELKNd = Omit<ElkNode, 'children'> & Pick<XYFlowNode, 'data'> & {
//   children?: ELKNd[]
// }

const getLayoutedElements = ({ nodes, edges }: Pick<DiagramView, 'nodes' | 'edges'>) => {
  const nodeLookup = new Map<string, DiagramNode>(nodes.map((node) => [node.id, node]))
  // const nodeLookup = new Map<string, ElkPoint>()

  const flattenElkGraph = (graph: ElkNode, offset?: ElkPoint & { id: string }): DiagramNode[] => {
    const original = nonNullable(nodeLookup.get(graph.id), `Node not found: ${graph.id}`)

    const absolute = {
      id: graph.id,
      x: graph.x! + (offset?.x ?? 0),
      y: graph.y! + (offset?.y ?? 0),
    }

    const node: DiagramNode = {
      ...original,
      position: [
        absolute.x,
        absolute.y,
      ],
      width: graph.width!,
      height: graph.height!,
    }

    nodeLookup.set(node.id, node)
    // if (offset) {
    //   xynode.parentId = offset.id
    // }
    if (graph.children && graph.children.length > 0) {
      return [node, ...graph.children.flatMap((child) => flattenElkGraph(child, absolute))]
    }
    return [node]
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
        height: node.height,
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
          },
        })),
        ...directOut.map((e): ElkPort => ({
          id: `${node.id}-${e.id}`,
          height: 1,
          width: 1,
          layoutOptions: {
            // side: 'SOUTH'
          },
        })),
      ],
      children: isLeaf ? [] : nodes.filter((n) => n.parent === node.id).map(toELkNode),
      // edges: edges.filter(e => e.parent === node.id).map(toELkEdge),
      layoutOptions: !isLeaf
        ? {
          // 'elk.portConstraints': 'FIXED_ORDER',
          // 'elk.portAlignment.north': 'DISTRIBUTED',
          'elk.padding': '[top=60.0,left=30.0,bottom=30.0,right=30.0]',
          // 'elk.layered.spacing.baseValue': '20',
          // 'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
        }
        : {
          // 'elk.portAlignment.north': 'DISTRIBUTED',
          'elk.portConstraints': 'FREE',
        },
    }
  }

  const toELkEdge = (edge: DiagramEdge): ElkExtendedEdge => {
    return {
      id: edge.id,
      sources: [`${edge.source}-${edge.id}`],
      targets: [`${edge.target}-${edge.id}`],
    }
  }

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.padding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]',
      'hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.direction': 'DOWN',
      'partitioning.activate': 'true',
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
    edges: edges.map(toELkEdge),
  }

  // console.log('graph', graph)

  return elk
    .layout(graph)
    .then((layoutedGraph) => {
      const nodes = layoutedGraph.children!.flatMap((child) => flattenElkGraph(child as any))
      return ({
        nodes,
        edges: layoutedGraph.edges!.flatMap((elkEdge): DiagramEdge | DiagramEdge[] => {
          const edge = edges.find((e) => e.id === elkEdge.id)
          if (!edge) {
            throw new Error(`Edge not found: ${elkEdge.id}`)
          }
          const container = nodeLookup.get((elkEdge as any).container ?? 'root')
          const [offsetX, offsetY] = container?.position ?? [0, 0]

          const controlPoints = pipe(
            elkEdge.sections!,
            flatMap(section => [
              section.startPoint,
              ...(section.bendPoints || []),
              section.endPoint,
            ]),
            map((point) => ({
              x: point.x + offsetX,
              y: point.y + offsetY,
            })),
          )
          if (!hasAtLeast(controlPoints, 2)) {
            return []
          }
          // const points = elkEdge.sections!.flatMap(section => [
          //   section.startPoint,
          //   ...(section.bendPoints || []),
          //   section.endPoint
          // ])
          return {
            ...edge,
            controlPoints,
          }
        }),
      })
    })
  // .catch(console.error)
}

export async function applyElk(diagram: DiagramView): Promise<DiagramView> {
  const { nodes, edges } = await getLayoutedElements(diagram)
  return {
    ...diagram,
    nodes,
    edges,
  }
}

// export function useELKLayout(diagram: DiagramView): Promise<DiagramView> {
//   return useMemo(() => applyElk(diagram), [diagram])
// }
