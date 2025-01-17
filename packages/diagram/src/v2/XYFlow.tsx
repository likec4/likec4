import { useCallbackRef } from '@mantine/hooks'
import clsx from 'clsx'
import type { EnforceOptional } from 'type-fest/source/enforce-optional'
import { BaseXYFlow } from '../base'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { edgeTypes, nodeTypes } from './custom'
import { useDiagramActor, useDiagramContext } from './hooks'
import type { Context } from './state/machine'
import type { Types } from './types'

const selectXYProps = (ctx: Context) => ({
  initialized: ctx.initialized,
  nodes: ctx.xynodes,
  edges: ctx.xyedges,
  pannable: ctx.pannable,
  zoomable: ctx.zoomable,
  fitViewPadding: ctx.fitViewPadding,
})

type Picked = EnforceOptional<
  Pick<
    LikeC4DiagramProperties,
    | 'background'
    | 'nodesDraggable'
    | 'nodesSelectable'
  >
>
export type LikeC4DiagramXYFlowProps = Required<Picked>

export const LikeC4DiagramXYFlow = ({ background, ...rest }: LikeC4DiagramXYFlowProps) => {
  const { send } = useDiagramActor()
  const {
    initialized,
    nodes,
    edges,
    ...props
  } = useDiagramContext(ctx => selectXYProps(ctx))

  return (
    <BaseXYFlow<Types.Node, Types.Edge>
      nodes={nodes}
      edges={edges}
      className={clsx(initialized ? 'initialized' : 'not-initialized')}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={useCallbackRef((changes) => {
        send({ type: 'xyflow.applyNodeChages', changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        send({ type: 'xyflow.applyEdgeChages', changes })
      })}
      background={initialized ? background : 'transparent'}
      // Fitview is handled in onInit
      fitView={false}
      onNodeClick={useCallbackRef((e, node) => {
        e.stopPropagation()
        send({ type: 'xyflow.nodeClick', node })
      })}
      onEdgeClick={useCallbackRef((e, edge) => {
        e.stopPropagation()
        send({ type: 'xyflow.edgeClick', edge })
      })}
      onPaneClick={useCallbackRef((e) => {
        e.stopPropagation()
        send({ type: 'xyflow.paneClick' })
      })}
      onDoubleClick={useCallbackRef(e => {
        e.stopPropagation()
        send({ type: 'xyflow.paneDblClick' })
      })}
      onMoveEnd={useCallbackRef((event, viewport) => {
        // if event is present, the move was triggered by user
        send({ type: 'xyflow.viewportMoved', viewport, manually: !!event })
      })}
      onInit={useCallbackRef((instance) => {
        send({ type: 'xyflow.init', instance })
      })}
      {...props}
      {...rest} />
  )
}
