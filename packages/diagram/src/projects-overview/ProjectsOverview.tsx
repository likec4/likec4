import type { ProjectId } from '@likec4/core'
import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import { useSyncedRef } from '@react-hookz/web'
import { useActorRef } from '@xstate/react'
import { ReactFlowProvider } from '@xyflow/react'
import { LayoutGroup } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { ViewPadding } from '../LikeC4Diagram.props'
import { projectOverviewLogic } from './actor'
import { ProjectsOverviewActorContextProvider } from './context'
import { ProjectsOverviewPanel } from './panel/ProjectsOverviewPanel'
import { type ProjectsOverviewXYProps, ProjectsOverviewXY } from './ProjectsOverviewXY'

export type ProjectsOverviewProps = {
  view: LayoutedProjectsView

  /**
   * Callback when project is selected (e.g. clicked)
   */
  onNavigateToProject?: undefined | ((projectId: ProjectId) => void)

  fitViewPadding?: ViewPadding | undefined
} & ProjectsOverviewXYProps

type ReactFlowProviderProps = Omit<Parameters<typeof ReactFlowProvider>[0], 'children'>

export function ProjectsOverview({
  view,
  onNavigateToProject,
  fitViewPadding = {
    top: '50px',
    bottom: '32px',
    left: '32px',
    right: '32px',
  },
  ...props
}: ProjectsOverviewProps) {
  const actorRef = useActorRef(
    projectOverviewLogic,
    {
      input: { view, fitViewPadding },
    },
  )

  useEffect(() => {
    actorRef.send({ type: 'update.view', view })
  }, [actorRef, view])

  const onNavigateToProjectRef = useSyncedRef(onNavigateToProject)

  useEffect(() => {
    const subs = [
      actorRef.on('navigate.to', ({ projectId }) => {
        onNavigateToProjectRef.current?.(projectId)
      }),
    ]
    return () => {
      subs.forEach((sub) => sub.unsubscribe())
    }
  }, [actorRef])

  const bounds = view.bounds
  const initialRef = useRef<ReactFlowProviderProps>({
    initialNodes: [],
    initialEdges: [],
    initialWidth: bounds.width,
    initialHeight: bounds.height,
    fitView: false,
  })

  return (
    <ProjectsOverviewActorContextProvider value={actorRef}>
      <ReactFlowProvider {...initialRef.current}>
        <LayoutGroup id={actorRef.sessionId} inherit={false}>
          <ProjectsOverviewXY {...props} />
        </LayoutGroup>
        <ProjectsOverviewPanel />
      </ReactFlowProvider>
    </ProjectsOverviewActorContextProvider>
  )
}
