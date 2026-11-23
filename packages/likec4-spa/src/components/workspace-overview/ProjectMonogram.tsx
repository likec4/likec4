import { defaultTheme } from '@likec4/core/styles'
import type { ExclusiveUnion, ProjectId } from '@likec4/core/types'
import { memo } from 'react'
import { type MonogramProps, Monogram } from '../ui/Monogram'
import { monogramColor, projectInitials } from './catalog'

type ProjectOrProjectId = ExclusiveUnion<{
  Project: { project: { id: ProjectId; title: string } }
  IdWithTitle: { projectId: ProjectId; title: string }
}>

/**
 * Monogram of a project: initials of the title, in a color stable per project id
 */
export const ProjectMonogram = memo<
  & Omit<MonogramProps, 'color' | 'children'>
  & ProjectOrProjectId
>(({ project, projectId, title, ...props }) => {
  // Because of ExclusiveUnion, at least one of these must be defined
  const id = (project?.id ?? projectId)!
  const t = (project?.title ?? title)!
  return (
    <Monogram color={defaultTheme.colors[monogramColor(id)].elements.stroke} {...props}>
      {projectInitials(t)}
    </Monogram>
  )
})
