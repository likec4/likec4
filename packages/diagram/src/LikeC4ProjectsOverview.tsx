import type { Simplify } from 'type-fest'
import { RootContainer } from './components/RootContainer'
import {
  EnsureMantine,
  FramerMotionConfig,
} from './context'
import { useId } from './hooks/useId'
import { useChangeLikeC4Project } from './hooks/useLikeC4Project'
import { LikeC4Styles } from './LikeC4Styles'
import { type ProjectsOverviewProps, ProjectsOverview } from './projects-overview'

export type LikeC4ProjectsOverviewProps = Simplify<
  Omit<ProjectsOverviewProps, 'id'> & {
    className?: string
    onSelectProject?: ProjectsOverviewProps['onNavigateToProject']
  }
>

export function LikeC4ProjectsOverview({
  view,
  className,
  onNavigateToProject,
  ...props
}: LikeC4ProjectsOverviewProps) {
  const onChangeLikeC4Project = useChangeLikeC4Project()
  const id = useId()

  // If no onSelectProject is provided, try from the context
  onNavigateToProject ??= onChangeLikeC4Project

  return (
    <EnsureMantine>
      <FramerMotionConfig>
        <LikeC4Styles id={id} />
        <RootContainer id={id} className={className}>
          <ProjectsOverview
            view={view}
            onNavigateToProject={onNavigateToProject}
            {...props} />
        </RootContainer>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}
