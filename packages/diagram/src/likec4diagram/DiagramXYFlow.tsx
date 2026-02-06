import { type EdgeId, type NodeId, nonNullable } from '@likec4/core'
import { cx } from '@likec4/styles/css'
import { useDebouncedCallback, useTimeout } from '@mantine/hooks'
import { useCustomCompareMemo } from '@react-hookz/web'
import type { OnMove, OnMoveEnd, Viewport } from '@xyflow/system'
import { shallowEqual } from 'fast-equals'
import type { PropsWithChildren } from 'react'
import type { JSX } from 'react/jsx-runtime'
import { isEmpty } from 'remeda'
import type { Simplify } from 'type-fest'
import { memoNode } from '../base-primitives/memoNode'
import { BaseXYFlow } from '../base/BaseXYFlow'
import { useDiagramEventHandlers } from '../context'
import { useIsReducedGraphics, usePanningAtom } from '../context/RootContainerContext'
import { selectDiagramActor, useCallbackRef, useDiagramSnapshot, useUpdateEffect } from '../hooks'
import { useDiagram } from '../hooks/useDiagram'
import { depsShallowEqual } from '../hooks/useUpdateEffect'
import type { LikeC4DiagramProperties, NodeRenderers } from '../LikeC4Diagram.props'
import { BuiltinEdges, BuiltinNodes } from './custom'
import { deriveToggledFeatures } from './state/machine.setup'
import type { DiagramActorSnapshot, DiagramContext } from './state/types'
import { viewBounds } from './state/utils'
import type { Types } from './types'
import { useLayoutConstraints } from './useLayoutConstraints'

const edgeTypes = {
  relationship: BuiltinEdges.RelationshipEdge,
  'seq-step': BuiltinEdges.SequenceStepEdge,
}

const builtinNodes = {
  element: memoNode(BuiltinNodes.ElementNode),
  deployment: memoNode(BuiltinNodes.DeploymentNode),
  'compound-element': memoNode(BuiltinNodes.CompoundElementNode),
  'compound-deployment': memoNode(BuiltinNodes.CompoundDeploymentNode),
  'view-group': memoNode(BuiltinNodes.ViewGroupNode),
  'seq-actor': memoNode(BuiltinNodes.SequenceActorNode),
  'seq-parallel': memoNode(BuiltinNodes.SequenceParallelArea),
}
function prepareNodeTypes(nodeTypes?: NodeRenderers): Types.NodeRenderers {
  if (!nodeTypes || isEmpty(nodeTypes)) {
    return builtinNodes
  }
  return {
    element: nodeTypes.element ?? builtinNodes.element,
    deployment: nodeTypes.deployment ?? builtinNodes.deployment,
    'compound-element': nodeTypes.compoundElement ?? builtinNodes['compound-element'],
    'compound-deployment': nodeTypes.compoundDeployment ?? builtinNodes['compound-deployment'],
    'view-group': nodeTypes.viewGroup ?? builtinNodes['view-group'],
    'seq-actor': nodeTypes.seqActor ?? builtinNodes['seq-actor'],
    'seq-parallel': nodeTypes.seqParallel ?? builtinNodes['seq-parallel'],
  }
}

const viewportToTopLeft = (ctx: DiagramContext): Viewport => {
  const bounds = viewBounds(ctx)
  return {
    x: -bounds.x,
    y: -bounds.y,
    zoom: 1,
  }
}

const selectXYProps = selectDiagramActor(({ context: ctx, children }) => {
  const { enableReadOnly } = deriveToggledFeatures(ctx)

  const isNotEditingEdge = enableReadOnly || children.editor?.getSnapshot().context.editing !== 'edge'

  let nodesDraggable = !enableReadOnly && ctx.nodesDraggable
  // if dynamic view display mode is sequence, disable nodes draggable
  if ((ctx.dynamicViewVariant === 'sequence' && ctx.view._type === 'dynamic')) {
    nodesDraggable = false
  }

  return ({
    enableReadOnly,
    initialized: ctx.initialized.xydata && ctx.initialized.xyflow,
    nodes: ctx.xynodes,
    edges: ctx.xyedges,
    pannable: ctx.pannable,
    zoomable: ctx.zoomable,
    nodesDraggable,
    nodesSelectable: ctx.nodesSelectable && isNotEditingEdge,
    fitViewPadding: ctx.fitViewPadding,
    enableFitView: ctx.features.enableFitView,
    ...(!ctx.features.enableFitView && {
      viewport: viewportToTopLeft(ctx),
    }),
  })
})
// const equalsXYProps = (a: ReturnType<typeof selectXYProps>, b: ReturnType<typeof selectXYProps>): boolean =>
//   a.enableReadOnly === b.enableReadOnly &&
//   a.initialized === b.initialized &&
//   a.pannable === b.pannable &&
//   a.zoomable === b.zoomable &&
//   a.nodesDraggable === b.nodesDraggable &&
//   a.nodesSelectable === b.nodesSelectable &&
//   a.enableFitView === b.enableFitView &&
//   shallowEqual(a.fitViewPadding, b.fitViewPadding) &&
//   a.nodes === b.nodes &&
//   a.edges === b.edges &&
//   shallowEqual(a.viewport ?? null, b.viewport ?? null)

export type LikeC4DiagramXYFlowProps = PropsWithChildren<
  Simplify<
    Pick<
      LikeC4DiagramProperties<any>,
      | 'background'
      | 'reactFlowProps'
      | 'renderNodes'
    >
  >
>
export function LikeC4DiagramXYFlow({
  background = 'dots',
  reactFlowProps = {},
  children,
  renderNodes,
}: LikeC4DiagramXYFlowProps): JSX.Element {
  const diagram = useDiagram()
  let {
    enableReadOnly,
    initialized,
    nodes,
    edges,
    enableFitView,
    nodesDraggable,
    nodesSelectable,
    ...props
  } = useDiagramSnapshot(selectXYProps)

  const {
    onNodeContextMenu,
    onCanvasContextMenu,
    onEdgeContextMenu,
    onNodeClick,
    onEdgeClick,
    onCanvasClick,
    onCanvasDblClick,
  } = useDiagramEventHandlers()

  const isReducedGraphics = useIsReducedGraphics(),
    layoutConstraints = useLayoutConstraints(),
    $isPanning = usePanningAtom(),
    isPanning = useTimeout(() => {
      $isPanning.set(true)
    }, isReducedGraphics ? 200 : 800),
    notPanning = useDebouncedCallback(() => {
      isPanning.clear()
      $isPanning.set(false)
    }, 200),
    onMove: OnMove = useCallbackRef((event) => {
      if (!event) {
        isPanning.clear()
        return
      }
      if (!$isPanning.get()) {
        isPanning.start()
      } else {
        notPanning()
      }
    }),
    onMoveEnd: OnMoveEnd = useCallbackRef((event, viewport) => {
      if (event) {
        notPanning()
      }
      diagram.send({
        type: 'xyflow.viewportMoved',
        viewport,
        manually: !!event,
      })
    }),
    onViewportResize = useCallbackRef(() => {
      diagram.send({ type: 'xyflow.resized' })
    }),
    nodeTypes = useCustomCompareMemo(
      () => prepareNodeTypes(renderNodes),
      [renderNodes],
      depsShallowEqual,
    )

  useUpdateEffect(() => {
    console.warn('renderNodes changed - this might degrade performance')
  }, [nodeTypes])

  return (
    <BaseXYFlow<Types.AnyNode, Types.AnyEdge>
      nodes={nodes}
      edges={edges}
      className={cx(initialized ? 'initialized' : 'not-initialized')}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={useCallbackRef((changes) => {
        diagram.send({ type: 'xyflow.applyChanges', nodes: changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        diagram.send({ type: 'xyflow.applyChanges', edges: changes })
      })}
      background={initialized ? background : 'transparent'}
      // Fitview is handled in onInit
      fitView={false}
      onNodeClick={useCallbackRef((e, node) => {
        e.stopPropagation()
        diagram.send({ type: 'xyflow.nodeClick', node })
        onNodeClick?.(diagram.findDiagramNode(node.id as NodeId)!, e)
      })}
      onEdgeClick={useCallbackRef((e, edge) => {
        e.stopPropagation()
        diagram.send({ type: 'xyflow.edgeClick', edge })
        onEdgeClick?.(diagram.findDiagramEdge(edge.id as EdgeId)!, e)
      })}
      onEdgeDoubleClick={useCallbackRef((e, edge) => {
        e.stopPropagation()
        diagram.send({ type: 'xyflow.edgeDoubleClick', edge })
      })}
      onPaneClick={useCallbackRef((e) => {
        e.stopPropagation()
        diagram.send({ type: 'xyflow.paneClick' })
        onCanvasClick?.(e as any)
      })}
      onDoubleClick={useCallbackRef(e => {
        e.stopPropagation()
        e.preventDefault()
        diagram.send({ type: 'xyflow.paneDblClick' })
        onCanvasDblClick?.(e as any)
      })}
      onNodeMouseEnter={useCallbackRef((event, node) => {
        event.stopPropagation()
        diagram.send({ type: 'xyflow.nodeMouseEnter', node })
      })}
      onNodeMouseLeave={useCallbackRef((event, node) => {
        event.stopPropagation()
        diagram.send({ type: 'xyflow.nodeMouseLeave', node })
      })}
      onEdgeMouseEnter={useCallbackRef((event, edge) => {
        event.stopPropagation()
        diagram.send({ type: 'xyflow.edgeMouseEnter', edge, event })
      })}
      onEdgeMouseLeave={useCallbackRef((event, edge) => {
        event.stopPropagation()
        diagram.send({ type: 'xyflow.edgeMouseLeave', edge, event })
      })}
      onMove={onMove}
      onMoveEnd={onMoveEnd}
      onInit={useCallbackRef((instance) => {
        diagram.send({ type: 'xyflow.init', instance })
      })}
      onNodeContextMenu={useCallbackRef((event, node) => {
        const diagramNode = nonNullable(
          diagram.findDiagramNode(node.id as NodeId),
          `diagramNode ${node.id} not found`,
        )
        onNodeContextMenu?.(diagramNode, event)
      })}
      onEdgeContextMenu={useCallbackRef((event, edge) => {
        const diagramEdge = nonNullable(
          diagram.findDiagramEdge(edge.id as EdgeId),
          `diagramEdge ${edge.id} not found`,
        )
        onEdgeContextMenu?.(diagramEdge, event)
      })}
      {...onCanvasContextMenu && {
        onPaneContextMenu: onCanvasContextMenu,
      }}
      {...enableFitView && {
        onViewportResize,
      }}
      nodesDraggable={nodesDraggable}
      nodesSelectable={nodesSelectable}
      elevateEdgesOnSelect={!enableReadOnly}
      zIndexMode="manual"
      {...(nodesDraggable && layoutConstraints)}
      {...props}
      {...reactFlowProps}>
      {children}
    </BaseXYFlow>
  )
}
