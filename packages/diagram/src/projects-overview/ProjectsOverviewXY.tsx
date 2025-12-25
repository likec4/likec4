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

export const edgeTypes = {
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

// const selector2 = (state: SnapshotFrom<RelationshipsBrowserActorRef>) => ({
//   subjectId: state.context.subject,
//   viewId: state.context.viewId,
//   scope: state.context.scope,
//   closeable: state.context.closeable,
// })

// const RelationshipsBrowserInner = memo(() => {
//   const browser = useRelationshipsBrowser()
//   const {
//     subjectId,
//     viewId,
//     scope,
//     closeable,
//   } = useRelationshipsBrowserState(selector2)

//   const store = useStoreApi<RelationshipsBrowserTypes.AnyNode, RelationshipsBrowserTypes.Edge>()
//   const instance = useReactFlow<RelationshipsBrowserTypes.AnyNode, RelationshipsBrowserTypes.Edge>()

//   useEffect(() => {
//     if (instance.viewportInitialized) {
//       browser.send({ type: 'xyflow.init', instance, store })
//     }
//   }, [store, instance.viewportInitialized, browser])

//   const layouted = useRelationshipsView(subjectId, viewId, scope)
//   const [historySubjectId, historyOps, { history, current }] = useStateHistory(subjectId)

//   useEffect(() => {
//     if (historySubjectId !== subjectId) {
//       historyOps.set(subjectId)
//     }
//   }, [subjectId])

//   useEffect(() => {
//     if (historySubjectId !== subjectId) {
//       browser.navigateTo(historySubjectId)
//     }
//   }, [historySubjectId, browser])

//   useRafEffect(() => {
//     browser.updateView(layouted)
//   }, [layouted, browser])

//   const hasStepBack = current > 0
//   const hasStepForward = current + 1 < history.length

//   return (
//     <>
//       <TopLeftPanel
//         hasStepBack={hasStepBack}
//         hasStepForward={hasStepForward}
//         onStepBack={() => historyOps.back()}
//         onStepForward={() => historyOps.forward()}
//       />
//       {closeable && (
//         <Panel position="top-right">
//           <ActionIcon
//             variant="default"
//             color="gray"
//             onClick={(e) => {
//               e.stopPropagation()
//               browser.close()
//             }}>
//             <IconX />
//           </ActionIcon>
//         </Panel>
//       )}
//     </>
//   )
// })

// type TopLeftPanelProps = {
//   hasStepBack: boolean
//   hasStepForward: boolean
//   onStepBack: () => void
//   onStepForward: () => void
// }
// const TopLeftPanel = ({
//   hasStepBack,
//   hasStepForward,
//   onStepBack,
//   onStepForward,
// }: TopLeftPanelProps) => {
//   return (
//     <Panel position="top-left">
//       <Group gap={4} wrap={'nowrap'}>
//         <AnimatePresence mode="popLayout">
//           {hasStepBack && (
//             <m.div
//               layout
//               initial={{ opacity: 0.05, transform: 'translateX(-5px)' }}
//               animate={{ opacity: 1, transform: 'translateX(0)' }}
//               exit={{
//                 opacity: 0.05,
//                 transform: 'translateX(-10px)',
//               }}
//               key={'back'}>
//               <ActionIcon
//                 variant="default"
//                 color="gray"
//                 onClick={e => {
//                   e.stopPropagation()
//                   onStepBack()
//                 }}>
//                 <IconChevronLeft />
//               </ActionIcon>
//             </m.div>
//           )}
//           {hasStepForward && (
//             <m.div
//               layout
//               initial={{ opacity: 0.05, transform: 'translateX(5px)' }}
//               animate={{ opacity: 1, transform: 'translateX(0)' }}
//               exit={{
//                 opacity: 0,
//                 transform: 'translateX(5px)',
//               }}
//               key={'forward'}>
//               <ActionIcon
//                 variant="default"
//                 color="gray"
//                 onClick={e => {
//                   e.stopPropagation()
//                   onStepForward()
//                 }}>
//                 <IconChevronRight />
//               </ActionIcon>
//             </m.div>
//           )}
//         </AnimatePresence>
//         <SelectElement />
//       </Group>
//     </Panel>
//   )
// }
