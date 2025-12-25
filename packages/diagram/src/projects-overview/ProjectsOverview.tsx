import type { ProjectId } from '@likec4/core'
import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import { useSyncedRef } from '@react-hookz/web'
import { useActorRef } from '@xstate/react'
import { ReactFlowProvider } from '@xyflow/react'
import { LayoutGroup } from 'motion/react'
import { useEffect, useRef } from 'react'
import { projectOverviewLogic } from './actor'
import { ProjectsOverviewActorContext } from './context'
import { type ProjectsOverviewXYProps, ProjectsOverviewXY } from './ProjectsOverviewXY'

export type ProjectsOverviewProps = {
  view: LayoutedProjectsView

  /**
   * Callback when project is selected (e.g. clicked)
   */
  onSelectProject?: undefined | ((projectId: ProjectId) => void)
} & ProjectsOverviewXYProps

type ReactFlowProviderProps = Omit<Parameters<typeof ReactFlowProvider>[0], 'children'>

export function ProjectsOverview({
  view,
  onSelectProject,
  ...props
}: ProjectsOverviewProps) {
  const actorRef = useActorRef(
    projectOverviewLogic,
    {
      input: { view },
    },
  )

  useEffect(() => {
    actorRef.send({ type: 'update.view', view })
  }, [actorRef, view])

  const onSelectProjectRef = useSyncedRef(onSelectProject)

  useEffect(() => {
    const subs = [
      actorRef.on('select.project', ({ projectId }) => {
        onSelectProjectRef.current?.(projectId)
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
    <ProjectsOverviewActorContext.Provider value={actorRef}>
      <ReactFlowProvider {...initialRef.current}>
        <LayoutGroup id={actorRef.sessionId} inherit={false}>
          <ProjectsOverviewXY {...props} />
        </LayoutGroup>
      </ReactFlowProvider>
    </ProjectsOverviewActorContext.Provider>
  )
}
