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
import { type ProjectsOverviewExports, defaultOverviewExports } from './exports'
import { ProjectsOverviewControls } from './panel/ProjectsOverviewControls'
import { ProjectsOverviewPanel } from './panel/ProjectsOverviewPanel'
import { type ProjectsOverviewXYProps, ProjectsOverviewXY } from './ProjectsOverviewXY'

export type ProjectsOverviewProps = {
  view: LayoutedProjectsView

  /**
   * Callback when project is selected (e.g. clicked)
   */
  onNavigateToProject?: undefined | ((projectId: ProjectId) => void)

  fitViewPadding?: ViewPadding | undefined

  /**
   * Whether to hide the navigation panel
   * @default false
   */
  hideNavigationPanel?: boolean | undefined

  /**
   * Formats the overview can be exported to, with their sources.
   * By default, only PNG and JPG are offered, as they work in the browser.
   */
  exports?: ProjectsOverviewExports | undefined
} & ProjectsOverviewXYProps

type ReactFlowProviderProps = Omit<Parameters<typeof ReactFlowProvider>[0], 'children'>

export function ProjectsOverview({
  view,
  onNavigateToProject,
  fitViewPadding = {
    top: '50px',
    bottom: '32px',
    left: '32px',
    // Keeps the side panel clear of the diagram
    right: '340px',
  },
  hideNavigationPanel,
  exports = defaultOverviewExports,
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
        {hideNavigationPanel !== true && <ProjectsOverviewPanel />}
        <ProjectsOverviewControls exports={exports} />
      </ReactFlowProvider>
    </ProjectsOverviewActorContextProvider>
  )
}
