import { useDebouncedEffect } from '@react-hookz/web'
import { Background, Controls, ReactFlow, ReactFlowProvider, useNodesInitialized } from '@xyflow/react'
import clsx from 'clsx'
import { type PropsWithChildren, useRef, useState } from 'react'
import useTilg from 'tilg'
import type { Exact } from 'type-fest'
import { useUpdateEffect } from './hooks'
import { cssDisableBg, cssDisablePan } from './index.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProps } from './props'
import { fromDiagramView } from './state/fromDiagramView'
import { DiagramStateProvider, useUpdateDiagramState } from './state2'
import OptionsPanel from './ui/OptionsPanel'
import { useXYFlow } from './xyflow'
import { RelationshipEdge } from './xyflow/edges/RelationshipEdge'
import { CompoundNode } from './xyflow/nodes/compound'
import { ElementNode } from './xyflow/nodes/element'
import { NodesEdgesUpdater } from './xyflow/NodesEdgesUpdater'
import type { XYFlowEdge, XYFlowInstance, XYFlowNode } from './xyflow/types'
import { useLayoutConstraints } from './xyflow/useNodeDragConstraints'

// export function LikeC4Diagram({
//   view,
//   readonly = false,
//   nodesDraggable = !readonly,
//   ...apiProps
// }: LikeC4DiagramProps) {
//   useTilg()
//   // Verify that the MantineProvider is available
//   useMantineContext()
//   const initial = useMemo(() => fromDiagramView(view, nodesDraggable), [])
//   return (
//     <ReactFlowProvider>
//       <DiagramStateProvider
//         view={view}
//         nodesDraggable={nodesDraggable}
//         readonly={readonly}
//         {...apiProps}
//       >
//         <LikeC4XYFlow
//           className={css.scope}
//           defaultNodes={initial.nodes}
//           defaultEdges={initial.edges}
//         />
//         <DiagramStateSync />
//       </DiagramStateProvider>
//     </ReactFlowProvider>
//   )
// }

// Guard, Ensure that object contains only event handlers
function isOnlyEventHandlers<T extends Exact<LikeC4DiagramEventHandlers, T>>(handlers: T): T {
  return handlers
}

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode
}
const edgeTypes = {
  relationship: RelationshipEdge
}

export function LikeC4Diagram({
  view,
  fitView = true,
  readonly = false,
  controls = !readonly,
  nodesDraggable = !readonly,
  disableBackground = false,
  disableHovercards = false,
  fitViewPadding = 0.05,
  onNavigateTo,
  ...props
}: LikeC4DiagramProps) {
  useTilg()
  const iniitialRef = useRef<
    ReturnType<typeof fromDiagramView> & {
      width: number
      height: number
    }
  >()
  if (!iniitialRef.current) {
    iniitialRef.current = {
      ...fromDiagramView(view, nodesDraggable),
      width: view.width,
      height: view.height
    }
  }
  return (
    <ReactFlowProvider
      fitView={fitView}
      defaultEdges={iniitialRef.current.edges}
      defaultNodes={iniitialRef.current.nodes}
      initialWidth={iniitialRef.current.width}
      initialHeight={iniitialRef.current.height}
    >
      <DiagramStateProvider
        disableHovercards={disableHovercards}
        onNavigateTo={onNavigateTo}
      >
        <LikeC4DiagramWithState
          defaultNodes={iniitialRef.current.nodes}
          defaultEdges={iniitialRef.current.edges}
          readonly={readonly}
          nodesDraggable={nodesDraggable}
          disableBackground={disableBackground}
          fitViewPadding={fitViewPadding}
          {...props}
        >
          {disableBackground !== true && <Background />}
          {controls && <Controls />}
          {!readonly && <OptionsPanel />}
          <NodesEdgesUpdater
            view={view}
            nodesDraggable={nodesDraggable}
          />
          <UpdateViewportOnDiagramChange viewId={view.id} />
        </LikeC4DiagramWithState>
      </DiagramStateProvider>
    </ReactFlowProvider>
  )
}

type LikeC4DiagramWithStateProps = PropsWithChildren<
  Omit<LikeC4DiagramProps, 'view' | 'disableHovercards' | 'controls'> & {
    defaultNodes: XYFlowNode[]
    defaultEdges: XYFlowEdge[]
  }
>

function LikeC4DiagramWithState({
  children,
  defaultNodes,
  defaultEdges,
  fitView = true,
  colorMode = 'system',
  readonly = false,
  pannable = true,
  zoomable = true,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  disableBackground = false,
  fitOnSelect = zoomable && nodesSelectable,
  fitViewPadding = 0.05,
  ...eventHandlers
}: LikeC4DiagramWithStateProps) {
  isOnlyEventHandlers(eventHandlers)
  useTilg()
  // Verify that the MantineProvider is available

  const xyflowRef = useRef<XYFlowInstance>()
  const updateState = useUpdateDiagramState()
  const layoutConstraints = useLayoutConstraints(xyflowRef)

  //
  // const prevViewId = useRef(view.id)

  const eventHandlersRef = useRef(eventHandlers)
  Object.assign(eventHandlersRef.current, eventHandlers)

  return (
    <ReactFlow
      className={clsx(disableBackground && cssDisableBg, !pannable && cssDisablePan)}
      colorMode={colorMode}
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes as any}
      zoomOnPinch={zoomable}
      zoomOnScroll={!pannable && zoomable}
      {...(!zoomable && {
        zoomActivationKeyCode: null
      })}
      maxZoom={zoomable || fitView ? 1.9 : 1}
      minZoom={zoomable || fitView ? 0.1 : 1}
      fitView={fitView}
      fitViewOptions={{
        minZoom: 0.1,
        maxZoom: 1,
        padding: fitViewPadding
      }}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={pannable}
      panOnDrag={pannable}
      elementsSelectable={nodesSelectable}
      {...(!nodesSelectable && {
        selectionKeyCode: null
      })}
      nodesDraggable={nodesDraggable}
      {...(nodesDraggable && layoutConstraints)}
      // edgesUpdatable={false}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or weird camera movement
      onNodeDoubleClick={(event, node) => {
        console.log('onNodeDoubleClick', node)
      }}
      onNodeClick={(event, node) => {
        console.log('onNodeClick', node.selected)
      }}
      onInit={(instance: XYFlowInstance) => {
        xyflowRef.current = instance
        updateState({ viewportInitialized: true })
      }}
      onEdgeMouseEnter={(event, edge) => {
        updateState({ hoveredEdgeId: edge.id })
      }}
      onEdgeMouseLeave={() => {
        updateState({ hoveredEdgeId: null })
      }}
      onNodeMouseEnter={(event, node) => {
        updateState({ hoveredNodeId: node.id })
      }}
      onNodeMouseLeave={() => {
        updateState({ hoveredNodeId: null })
      }}
    >
      {children}
    </ReactFlow>
  )
}

/**
 * Fits the view when the view changes and nodes are initialized
 */
function UpdateViewportOnDiagramChange({ viewId }: { viewId: string }) {
  const xyflow = useXYFlow()
  const nodeInitialized = useNodesInitialized({
    includeHiddenNodes: true
  })
  const prevViewIdRef = useRef(viewId)

  useDebouncedEffect(
    () => {
      if (!nodeInitialized || prevViewIdRef.current === viewId) {
        return
      }
      const zoom = xyflow.getZoom()
      xyflow.fitView({
        duration: 400,
        maxZoom: Math.max(1, zoom)
      })
      prevViewIdRef.current = viewId
    },
    [nodeInitialized, viewId],
    20
  )
  return null
}
