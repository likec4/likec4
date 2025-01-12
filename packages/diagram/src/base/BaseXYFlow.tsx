import { useSelector } from '@xstate/react'
import type { ExtractEventsFromPayloadMap } from '@xstate/store'
import {
  type EdgeChange,
  type EdgeReplaceChange,
  type NodeChange,
  type NodeReplaceChange,
  type ReactFlowProps,
  ReactFlow,
  useOnViewportChange,
  useStoreApi,
} from '@xyflow/react'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { memo, useCallback } from 'react'
import type { ActorRef, Snapshot } from 'xstate'
import * as css from '../LikeC4Diagram.css'
import { type XYBackground, Background } from './Background'
import { MaxZoom, MinZoom } from './const'
import type { BaseTypes } from './types'

type StoreSnapshot<NodeType, EdgeType> = Snapshot<unknown> & {
  context: {
    initialized: boolean
    xynodes: NodeType[]
    xyedges: EdgeType[]
  }
}

type BaseActorRef<
  NodeType extends BaseTypes.Node,
  EdgeType extends BaseTypes.Edge,
> = ActorRef<
  StoreSnapshot<NodeType, EdgeType>,
  ExtractEventsFromPayloadMap<{
    onInit: {}
    applyNodeChanges: {
      changes: NodeChange<NodeType>[]
    }
    applyEdgeChanges: {
      changes: EdgeChange<EdgeType>[]
    }
  }>,
  any
>

export type BaseXYFlowProps = {
  /**
   * Enable/disable panning
   * @default true
   */
  pannable?: boolean | undefined
  /**
   * Enable/disable zooming
   * @default true
   */
  zoomable?: boolean | undefined
  /**
   * @default true
   */
  nodesSelectable?: boolean | undefined

  /**
   * @default false
   */
  nodesDraggable?: boolean | undefined

  /**
   * Background pattern
   * @default 'dots'
   */
  background?: 'transparent' | 'solid' | XYBackground | undefined

  fitViewPadding?: number | undefined
}

type Props<NodeType extends BaseTypes.Node, EdgeType extends BaseTypes.Edge> =
  & BaseXYFlowProps
  & {
    actorRef: BaseActorRef<NodeType, EdgeType>

    // Assert if the following props are passed
    nodes?: never
    edges?: never
    onNodesChange?: never
    onEdgesChange?: never
  }
  & Omit<
    ReactFlowProps<
      NodeType,
      EdgeType
    >,
    'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange'
  >

const selector = <NodeType, EdgeType>(snapshot: StoreSnapshot<NodeType, EdgeType>) => ({
  initialized: snapshot.context.initialized,
  nodes: snapshot.context.xynodes,
  edges: snapshot.context.xyedges,
})
type Selected = ReturnType<typeof selector>
const compare = (a: Selected, b: Selected) =>
  shallowEqual(a.nodes, b.nodes) && shallowEqual(a.edges, b.edges) && a.initialized === b.initialized

export const BaseXYFlow = <
  NodeType extends BaseTypes.Node,
  EdgeType extends BaseTypes.Edge,
>({
  actorRef,
  className,
  pannable = true,
  zoomable = true,
  nodesSelectable = true,
  nodesDraggable = false,
  background = 'dots',
  children,
  colorMode = 'system',
  fitViewPadding = 0,
  fitView = true,
  ...props
}: Props<NodeType, EdgeType>) => {
  const {
    nodes,
    edges,
    initialized,
  } = useSelector(
    actorRef,
    selector,
    compare,
  )

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
        initialized ? 'initialized' : css.notInitialized,
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
      fitViewOptions={{
        minZoom: MinZoom,
        maxZoom: 1,
        padding: fitViewPadding,
        includeHiddenNodes: false,
      }}
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
      onNodesChange={useCallback((changes) => {
        actorRef.send({ type: 'applyNodeChanges', changes })
      }, [actorRef])}
      onEdgesChange={useCallback((changes) => {
        actorRef.send({ type: 'applyEdgeChanges', changes })
      }, [actorRef])}
      onNodeMouseEnter={useCallback((_event, node) => {
        const replaceChange: NodeReplaceChange<NodeType> = {
          id: node.id,
          type: 'replace',
          item: {
            ...node,
            data: {
              ...node.data,
              hovered: true,
            },
          },
        }
        actorRef.send({ type: 'applyNodeChanges', changes: [replaceChange] })
      }, [actorRef])}
      onNodeMouseLeave={useCallback((_event, node) => {
        const replaceChange: NodeReplaceChange<NodeType> = {
          id: node.id,
          type: 'replace',
          item: {
            ...node,
            data: {
              ...node.data,
              hovered: false,
            },
          },
        }
        actorRef.send({ type: 'applyNodeChanges', changes: [replaceChange] })
      }, [actorRef])}
      onEdgeMouseEnter={useCallback((_event, edge) => {
        const replaceChange: EdgeReplaceChange<EdgeType> = {
          id: edge.id,
          type: 'replace',
          item: {
            ...edge,
            data: {
              ...edge.data,
              hovered: true,
            },
          },
        }
        actorRef.send({ type: 'applyEdgeChanges', changes: [replaceChange] })
      }, [actorRef])}
      onEdgeMouseLeave={useCallback((_event, edge) => {
        const replaceChange: EdgeReplaceChange<EdgeType> = {
          id: edge.id,
          type: 'replace',
          item: {
            ...edge,
            data: {
              ...edge.data,
              hovered: false,
            },
          },
        }
        actorRef.send({ type: 'applyEdgeChanges', changes: [replaceChange] })
      }, [actorRef])}
      onInit={useCallback(() => {
        actorRef.send({ type: 'onInit' })
      }, [actorRef])}
      {...props}
    >
      {isBgWithPattern && initialized && <Background background={background} />}
      <BaseXYFlowInner />
      {children}
    </ReactFlow>
  )
}

const BaseXYFlowInner = memo(() => {
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
})
