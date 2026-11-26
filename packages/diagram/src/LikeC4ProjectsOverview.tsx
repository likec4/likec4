import type { JSX } from 'react/jsx-runtime'
import type { Simplify } from 'type-fest'
import { LARGE_VIEW_AREA } from './base'
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
  ProjectsOverviewProps & {
    className?: string
    onSelectProject?: ProjectsOverviewProps['onNavigateToProject']
  }
>

export function LikeC4ProjectsOverview({
  view,
  className,
  onNavigateToProject,
  ...props
}: LikeC4ProjectsOverviewProps): JSX.Element {
  const onChangeLikeC4Project = useChangeLikeC4Project()
  const id = useId()

  // If no onSelectProject is provided, try from the context
  onNavigateToProject ??= onChangeLikeC4Project

  const reduceGraphics = view.bounds.width * view.bounds.height > LARGE_VIEW_AREA

  return (
    <EnsureMantine>
      <FramerMotionConfig reducedMotion={reduceGraphics ? 'always' : undefined}>
        <LikeC4Styles rootSelector={`#${id}`} />
        <RootContainer id={id} className={className} reduceGraphics={reduceGraphics}>
          <ProjectsOverview
            view={view}
            onNavigateToProject={onNavigateToProject}
            {...props} />
        </RootContainer>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}
