import { cx } from '@likec4/styles/css'
import { shallowEqual } from 'fast-equals'
import { memo } from 'react'
import { BaseXYFlow } from '../base/BaseXYFlow'
import { useCallbackRef } from '../hooks/useCallbackRef'
import type { ProjectsOverviewTypes } from './_types'
import type { ProjectsOverviewSnapshot } from './actor'
import { useProjectsOverviewActor } from './context'
import { ProjectNode, RelationshipEdge } from './custom'
import { useProjectsOverviewState, useProjectsOverviewXYStoreApi } from './hooks'

const nodeTypes: ProjectsOverviewTypes.NodeRenderers = {
  project: ProjectNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

const selector = (state: ProjectsOverviewSnapshot) => ({
  isActive: state.hasTag('active'),
  nodes: state.context.xynodes,
  edges: state.context.xyedges,
})
const selectorEq = (a: ReturnType<typeof selector>, b: ReturnType<typeof selector>) =>
  a.isActive === b.isActive &&
  shallowEqual(a.nodes, b.nodes) &&
  shallowEqual(a.edges, b.edges)

export type ProjectsOverviewXYProps = {
  /**
   * Background pattern
   * @default 'dots'
   */
  background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined

  /**
   * @default - determined by the user's system preferences.
   */
  colorScheme?: 'light' | 'dark' | undefined
}
export const ProjectsOverviewXY = memo<ProjectsOverviewXYProps>(({
  background = 'dots',
  ...props
}) => {
  const actorRef = useProjectsOverviewActor()
  const {
    isActive,
    nodes,
    edges,
  } = useProjectsOverviewState(
    selector,
    selectorEq,
  )

  const xystore = useProjectsOverviewXYStoreApi()

  return (
    <BaseXYFlow<ProjectsOverviewTypes.Node, ProjectsOverviewTypes.Edge>
      nodes={nodes}
      edges={edges}
      className={cx(
        isActive ? 'initialized' : 'not-initialized',
        'projects-overview',
      )}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      // Fitview is handled in onInit
      fitView={false}
      onNodeClick={useCallbackRef((_e, node) => {
        _e.stopPropagation()
        actorRef.send({ type: 'xyflow.click.node', node })
      })}
      onEdgeClick={useCallbackRef((_e, edge) => {
        _e.stopPropagation()
        actorRef.send({ type: 'xyflow.click.edge', edge })
      })}
      onPaneClick={useCallbackRef((_e) => {
        _e.stopPropagation()
        actorRef.send({ type: 'xyflow.click.pane' })
      })}
      onDoubleClick={useCallbackRef((_e) => {
        _e.stopPropagation()
        actorRef.send({ type: 'xyflow.click.double' })
      })}
      onNodesChange={useCallbackRef((changes) => {
        actorRef.send({ type: 'xyflow.applyNodeChanges', changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        actorRef.send({ type: 'xyflow.applyEdgeChanges', changes })
      })}
      onEdgeMouseEnter={useCallbackRef((event, edge) => {
        actorRef.send({ type: 'xyflow.mouse.enter.edge', edge, event })
      })}
      onEdgeMouseLeave={useCallbackRef((event, edge) => {
        actorRef.send({ type: 'xyflow.mouse.leave.edge', edge, event })
      })}
      onNodeMouseEnter={useCallbackRef((event, node) => {
        actorRef.send({ type: 'xyflow.mouse.enter.node', node })
      })}
      onNodeMouseLeave={useCallbackRef((event, node) => {
        actorRef.send({ type: 'xyflow.mouse.leave.node', node })
      })}
      onInit={useCallbackRef((xyflow) => {
        actorRef.send({ type: 'xyflow.init', xyflow, xystore })
      })}
      nodesDraggable={false}
      nodesSelectable
      pannable
      zoomable
      background={background}
      {...props}
    />
  )
})
ProjectsOverviewXY.displayName = 'ProjectsOverviewXY'
