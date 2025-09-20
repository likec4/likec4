import { type EdgeId, type NodeId, nonNullable } from '@likec4/core'
import type { NodeModel } from '@likec4/core/model'
import type { aux } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { useCallbackRef, useDebouncedCallback, useTimeout } from '@mantine/hooks'
import { useCustomCompareMemo } from '@react-hookz/web'
import type { NodeProps as ReactFlowNodeProps, OnMove, OnMoveEnd } from '@xyflow/system'
import { deepEqual, shallowEqual } from 'fast-equals'
import { type FC, type PropsWithChildren } from 'react'
import type { Simplify } from 'type-fest'
import { BaseXYFlow } from '../base/BaseXYFlow'
import { customNode } from '../base/primitives/customNode'
import { useDiagramEventHandlers } from '../context'
import { useIsReducedGraphics, usePanningAtom } from '../context/ReduceGraphics'
import { useUpdateEffect } from '../hooks'
import { useDiagram, useDiagramContext } from '../hooks/useDiagram'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { useLikeC4ViewModel } from '../likec4model/useLikeC4Model'
import type { DiagramContext } from '../state/types'
import { BuiltinNodes, edgeTypes, SequenceParallelArea } from './custom'
import { DiagramUI } from './DiagramUI'
import type { Types } from './types'
import { useLayoutConstraints } from './useLayoutConstraints'

const selectXYProps = (ctx: DiagramContext) => ({
  initialized: ctx.initialized.xydata && ctx.initialized.xyflow,
  nodes: ctx.xynodes,
  edges: ctx.xyedges,
  pannable: ctx.pannable,
  zoomable: ctx.zoomable,
  fitViewPadding: ctx.fitViewPadding,
  enableFitView: ctx.features.enableFitView,
  enableReadOnly: ctx.features.enableReadOnly || ctx.toggledFeatures.enableReadOnly
    // if dynamic view display mode is sequence, enable readonly
    || (ctx.dynamicViewVariant === 'sequence' && ctx.view._type === 'dynamic'),
  ...(!ctx.features.enableFitView && {
    viewport: {
      x: -Math.min(ctx.view.bounds.x, 0),
      y: -Math.min(ctx.view.bounds.y, 0),
      zoom: 1,
    },
  }),
})
const equalsXYProps = (a: ReturnType<typeof selectXYProps>, b: ReturnType<typeof selectXYProps>): boolean =>
  a.initialized === b.initialized &&
  a.pannable === b.pannable &&
  a.zoomable === b.zoomable &&
  a.enableFitView === b.enableFitView &&
  a.enableReadOnly === b.enableReadOnly &&
  deepEqual(a.fitViewPadding, b.fitViewPadding) &&
  shallowEqual(a.nodes, b.nodes) &&
  shallowEqual(a.edges, b.edges) &&
  shallowEqual(a.viewport ?? null, b.viewport ?? null)

type Any = aux.Any
type Unknown = aux.UnknownLayouted

// type NP = {
//   id: string
//   type: string
//   data: {
//     id: NodeId
//     viewId: string
//   }
// }
interface CustomDiagramNodeProps<A extends Any, P extends ReactFlowNodeProps<any>> {
  nodeProps: P
  nodeModel: NodeModel<A>
}

function customDiagramNode<P extends CustomDiagramNodeProps<any, any>>(
  Node: FC<P>,
): FC<P['nodeProps']> {
  return customNode((props: P['nodeProps']) => {
    // @ts-ignore because dts-bundler fails to infer types
    const viewId = props.data.viewId
    const viewModel = useLikeC4ViewModel(viewId)
    if (!viewModel) {
      console.error(`View "${viewId}" not found, requested by customNode "${props.data.id}"`, { props })
      return null
    }
    const model = viewModel.findNode(props.data.id)
    if (!model) {
      console.error(
        `Node "${props.id}" not found in view "${viewId}", requested by customNode "${props.data.id}"`,
        { props },
      )
      return null
    }
    // @ts-ignore because dts-bundler fails to infer types
    return <Node nodeProps={props} nodeModel={model} />
  })
}

export type LikeC4DiagramXYFlowProps = PropsWithChildren<
  Simplify<
    Pick<
      LikeC4DiagramProperties<any>,
      | 'background'
      | 'nodesDraggable'
      | 'nodesSelectable'
      | 'reactFlowProps'
      | 'renderNodes'
    >
  >
>
export function LikeC4DiagramXYFlow({
  background = 'dots',
  nodesDraggable = false,
  nodesSelectable = false,
  reactFlowProps = {},
  children,
  renderNodes,
}: LikeC4DiagramXYFlowProps) {
  const diagram = useDiagram()
  const {
    initialized,
    nodes,
    edges,
    enableReadOnly,
    enableFitView,
    ...props
  } = useDiagramContext(selectXYProps, equalsXYProps)

  const {
    onNodeContextMenu,
    onCanvasContextMenu,
    onEdgeContextMenu,
    onNodeClick,
    onEdgeClick,
    onCanvasClick,
    onCanvasDblClick,
  } = useDiagramEventHandlers()

  const notReadOnly = !enableReadOnly,
    isReducedGraphics = useIsReducedGraphics(),
    layoutConstraints = useLayoutConstraints(),
    $isPanning = usePanningAtom(),
    isPanning = useTimeout(() => {
      $isPanning.set(true)
    }, isReducedGraphics ? 120 : 400),
    notPanning = useDebouncedCallback(() => {
      isPanning.clear()
      if ($isPanning.get()) {
        $isPanning.set(false)
      }
    }, isReducedGraphics ? 350 : 200),
    onMove: OnMove = useCallbackRef((event) => {
      if (!event) {
        return
      }
      if (!$isPanning.get()) {
        isPanning.start()
      }
      notPanning()
    }),
    onMoveEnd: OnMoveEnd = useCallbackRef((event, viewport) => {
      isPanning.clear()
      diagram.send({ type: 'xyflow.viewportMoved', viewport, manually: !!event })
    }),
    onViewportResize = useCallbackRef(() => {
      diagram.send({ type: 'xyflow.resized' })
    }),
    nodeTypes = useCustomCompareMemo(
      () => {
        return {
          element: renderNodes?.element ? customDiagramNode(renderNodes.element) : BuiltinNodes.element,
          deployment: renderNodes?.deployment ? customDiagramNode(renderNodes.deployment) : BuiltinNodes.deployment,
          'compound-element': renderNodes?.compoundElement
            ? customDiagramNode(renderNodes.compoundElement)
            : BuiltinNodes.compoundElement,
          'compound-deployment': renderNodes?.compoundDeployment
            ? customDiagramNode(renderNodes.compoundDeployment)
            : BuiltinNodes.compoundDeployment,
          'view-group': renderNodes?.viewGroup ? customDiagramNode(renderNodes.viewGroup) : BuiltinNodes.viewGroup,
          'seq-actor': BuiltinNodes.sequenceActor,
          'seq-parallel': SequenceParallelArea,
        } satisfies Record<Types.Node['type'], any>
      },
      [renderNodes],
      shallowEqual,
    )

  useUpdateEffect(() => {
    console.warn('renderNodes changed - this might degrade performance')
  }, [nodeTypes])

  return (
    <>
      <BaseXYFlow<Types.Node, Types.Edge>
        nodes={nodes}
        edges={edges}
        className={cx(initialized ? 'initialized' : 'not-initialized')}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={useCallbackRef((changes) => {
          diagram.send({ type: 'xyflow.applyNodeChanges', changes })
        })}
        onEdgesChange={useCallbackRef((changes) => {
          diagram.send({ type: 'xyflow.applyEdgeChanges', changes })
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
        onNodeMouseEnter={useCallbackRef((_event, node) => {
          _event.stopPropagation()
          if (!node.data.hovered) {
            diagram.send({ type: 'xyflow.nodeMouseEnter', node })
          }
        })}
        onNodeMouseLeave={useCallbackRef((_event, node) => {
          _event.stopPropagation()
          if (node.data.hovered) {
            diagram.send({ type: 'xyflow.nodeMouseLeave', node })
          }
        })}
        onEdgeMouseEnter={useCallbackRef((event, edge) => {
          event.stopPropagation()
          if (!edge.data.hovered) {
            diagram.send({ type: 'xyflow.edgeMouseEnter', edge, event })
          }
        })}
        onEdgeMouseLeave={useCallbackRef((event, edge) => {
          event.stopPropagation()
          if (edge.data.hovered) {
            diagram.send({ type: 'xyflow.edgeMouseLeave', edge, event })
          }
        })}
        {...props.pannable && {
          onMove,
        }}
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
        onPaneContextMenu={useCallbackRef((event) => {
          onCanvasContextMenu?.(event as any)
        })}
        {...enableFitView && {
          onViewportResize,
        }}
        nodesDraggable={notReadOnly && nodesDraggable}
        nodesSelectable={nodesSelectable}
        edgesFocusable={false}
        {...(notReadOnly && nodesDraggable && layoutConstraints)}
        {...props}
        {...reactFlowProps}>
        {children}
      </BaseXYFlow>
      <DiagramUI key={'DiagramUI'} />
    </>
  )
}
