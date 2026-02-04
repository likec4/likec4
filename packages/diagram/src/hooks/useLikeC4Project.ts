import type {
  LikeC4Project,
  ProjectId,
} from '@likec4/core/types'
import { useOptionalLikeC4Model } from '../context/LikeC4ModelContext'
import { type LikeC4ProjectsContext, useOptionalProjectsContext } from '../context/LikeC4ProjectsContext'

const emptyProjects: ReadonlyArray<LikeC4Project> = []
function onProjectChange(id: ProjectId) {
  console.warn(`Triggered callback to change project to ${id}, but no <LikeC4ProjectsProvider/> found`)
}
const emptyContext: LikeC4ProjectsContext = {
  projects: emptyProjects,
  onProjectChange: onProjectChange,
}

export function useLikeC4ProjectsContext(): LikeC4ProjectsContext {
  return useOptionalProjectsContext() ?? emptyContext
}

/**
 * @returns The list of available projects, or empty array if no projects are available.
 */
export function useLikeC4Projects(): ReadonlyArray<LikeC4Project> {
  return useLikeC4ProjectsContext().projects
}

/**
 * @returns The callback to change current project, or a no-op if no LikeC4ProjectsProvider is found.
 */
export function useChangeLikeC4Project(): (id: ProjectId) => void {
  return useLikeC4ProjectsContext().onProjectChange
}

/**
 * @returns True if there are more than one project available in the context.
 */
export function useHasProjects(): boolean {
  const ctx = useOptionalProjectsContext()
  if (!ctx) {
    return false
  }
  return ctx.projects.length > 1
}

/**
 * @returns Current project id, as provided by LikeC4Model
 */
export function useLikeC4ProjectId(): ProjectId {
  const ctx = useOptionalLikeC4Model()
  if (!ctx) {
    throw new Error('No LikeC4ModelProvider found')
  }
  return ctx.projectId as ProjectId
}

/**
 * Returns current LikeC4 project.
 * Requires both LikeC4ModelProvider and LikeC4ProjectsProvider in the tree
 */
export function useLikeC4Project(): LikeC4Project {
  const modelCtx = useOptionalLikeC4Model()
  const projectsCtx = useOptionalProjectsContext()
  if (!modelCtx) {
    throw new Error('No LikeC4ModelProvider found')
  }
  const project = projectsCtx?.projects.find(p => p.id === modelCtx.projectId)
  return project ?? modelCtx.project
}
