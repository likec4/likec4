import { useCallbackRef } from '@mantine/hooks'
import {
  type ReactFlowProps,
  ReactFlow,
  useOnViewportChange,
  useStoreApi,
} from '@xyflow/react'
import clsx from 'clsx'
import { useMemo } from 'react'
import type { SetRequired, Simplify } from 'type-fest'
import * as css from '../LikeC4Diagram.css'
import { type XYBackground, Background } from './Background'
import { MaxZoom, MinZoom } from './const'
import { BaseTypes } from './types'

// type StoreSnapshot<NodeType, EdgeType> = Snapshot<unknown> & {
//   context: {
//     initialized: boolean
//     xynodes: NodeType[]
//     xyedges: EdgeType[]
//   }
// }

// type BaseActorRef<
//   NodeType extends BaseTypes.Node,
//   EdgeType extends BaseTypes.Edge,
// > = ActorRef<
//   StoreSnapshot<NodeType, EdgeType>,
//   ExtractEventsFromPayloadMap<{
//     onInit: {}
//     applyNodeChanges: {
//       changes: NodeChange<NodeType>[]
//     }
//     applyEdgeChanges: {
//       changes: EdgeChange<EdgeType>[]
//     }
//   }>,
//   any
// >

export type BaseXYFlowProps<NodeType extends BaseTypes.Node, EdgeType extends BaseTypes.Edge> = Simplify<
  & {
    pannable: boolean
    zoomable: boolean
    nodesSelectable: boolean
    nodesDraggable: boolean
    background: 'transparent' | 'solid' | XYBackground
    fitViewPadding: number
  }
  & SetRequired<
    Omit<
      ReactFlowProps<NodeType, EdgeType>,
      // Omited props
      | 'defaultNodes'
      | 'defaultEdges'
      | 'panOnScroll'
      | 'panOnDrag'
      | 'preventScrolling'
      | 'zoomOnPinch'
      | 'zoomActivationKeyCode'
      | 'zoomOnDoubleClick'
      | 'zoomOnScroll'
      | 'elementsSelectable'
      | 'onNodeMouseEnter'
      | 'onNodeMouseLeave'
      | 'onEdgeMouseEnter'
      | 'onEdgeMouseLeave'
      | 'fitViewOptions'
    >,
    // Required props
    | 'nodes'
    | 'edges'
    | 'onNodesChange'
    | 'onEdgesChange'
  >
>

// // type Props<NodeType extends BaseTypes.Node, EdgeType extends BaseTypes.Edge> =
// //   & BaseXYFlowProps
// //   & {
// //     actorRef: BaseActorRef<NodeType, EdgeType>

// //     // Assert if the following props are passed
// //     nodes?: never
// //     edges?: never
// //     onNodesChange?: never
// //     onEdgesChange?: never
// //   }
// //   & Omit<
// //     ReactFlowProps<
// //       NodeType,
// //       EdgeType
// //     >,
// //     'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange'
// //   >

// const selector = <NodeType, EdgeType>(snapshot: StoreSnapshot<NodeType, EdgeType>) => ({
//   initialized: snapshot.context.initialized,
//   nodes: snapshot.context.xynodes,
//   edges: snapshot.context.xyedges,
// })
// type Selected = ReturnType<typeof selector>
// const compare = (a: Selected, b: Selected) =>
//   shallowEqual(a.nodes, b.nodes) && shallowEqual(a.edges, b.edges) && a.initialized === b.initialized

export const BaseXYFlow = <
  NodeType extends BaseTypes.Node,
  EdgeType extends BaseTypes.Edge,
>({
  nodes,
  edges,
  onEdgesChange,
  onNodesChange,
  className,
  pannable,
  zoomable,
  nodesSelectable,
  nodesDraggable,
  background,
  children,
  colorMode = 'system',
  fitViewPadding,
  fitView = true,
  ...props
}: BaseXYFlowProps<NodeType, EdgeType>) => {
  const isBgWithPattern = background !== 'transparent' && background !== 'solid'

  return (
    <ReactFlow<NodeType, EdgeType>
      colorMode={colorMode}
      nodes={nodes}
      edges={edges}
      className={clsx(
        'likec4-diagram',
        css.cssReactFlow,
        pannable !== true && css.cssDisablePan,
        background === 'transparent' && css.cssTransparentBg,
        // initialized ? 'initialized' : css.notInitialized,
        className,
      )}
      zoomOnPinch={zoomable}
      zoomOnScroll={!pannable && zoomable}
      {...(!zoomable && {
        zoomActivationKeyCode: null,
      })}
      zoomOnDoubleClick={false}
      maxZoom={zoomable ? MaxZoom : 1}
      minZoom={zoomable ? MinZoom : 1}
      fitView={fitView}
      fitViewOptions={useMemo(() => ({
        minZoom: MinZoom,
        maxZoom: 1,
        padding: fitViewPadding,
        includeHiddenNodes: false,
      }), [fitViewPadding])}
      preventScrolling={zoomable || pannable}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={pannable}
      panOnDrag={pannable}
      {...(!pannable && {
        selectionKeyCode: null,
      })}
      elementsSelectable={nodesSelectable}
      nodesFocusable={nodesDraggable || nodesSelectable}
      edgesFocusable={false}
      nodesDraggable={nodesDraggable}
      nodeDragThreshold={4}
      elevateNodesOnSelect={false} // or edges are not visible after select\
      selectNodesOnDrag={false}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeMouseEnter={useCallbackRef((_event, node) => {
        onNodesChange([{
          id: node.id,
          type: 'replace',
          item: BaseTypes.setHovered(node, true),
        }])
      })}
      onNodeMouseLeave={useCallbackRef((_event, node) => {
        onNodesChange([{
          id: node.id,
          type: 'replace',
          item: BaseTypes.setHovered(node, false),
        }])
      })}
      onEdgeMouseEnter={useCallbackRef((_event, edge) => {
        onEdgesChange([{
          id: edge.id,
          type: 'replace',
          item: BaseTypes.setHovered(edge, true),
        }])
      })}
      onEdgeMouseLeave={useCallbackRef((_event, edge) => {
        onEdgesChange([{
          id: edge.id,
          type: 'replace',
          item: BaseTypes.setHovered(edge, false),
        }])
      })}
      {...props}
    >
      {isBgWithPattern && <Background background={background} />}
      <BaseXYFlowInner />
      {children}
    </ReactFlow>
  )
}

const BaseXYFlowInner = () => {
  const xyflowApi = useStoreApi()

  /**
   * WORKAROUND - Called on viewport change
   * Viewport transform is not rounded to integers which results in blurry nodes on some resolution
   * https://github.com/xyflow/xyflow/issues/3282
   * https://github.com/likec4/likec4/issues/734
   */
  useOnViewportChange({
    onEnd: ({ x, y, zoom }) => {
      const roundedX = Math.round(x),
        roundedY = Math.round(y)
      if (x !== roundedX || y !== roundedY) {
        xyflowApi.setState({ transform: [roundedX, roundedY, zoom] })
      }
    },
  })

  return <></>
}
