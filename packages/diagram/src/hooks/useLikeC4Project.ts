import type {
  LikeC4Project,
  ProjectId,
} from '@likec4/core/types'
import { useContext } from 'react'
import { LikeC4ModelContext } from '../context/LikeC4ModelContext'
import { LikeC4ProjectsContext } from '../context/LikeC4ProjectsContext'

const emptyProjects: ReadonlyArray<LikeC4Project> = []
/**
 * @returns The list of available projects, or empty array if no projects are available.
 */
export function useLikeC4Projects(): ReadonlyArray<LikeC4Project> {
  const ctx = useContext(LikeC4ProjectsContext)
  if (!ctx) {
    return emptyProjects
  }
  return ctx.projects
}

const emptyOnProjectChange: (id: ProjectId) => void = () => {}
/**
 * @returns The callback to change current project.
 */
export function useChangeLikeC4Project(): (id: ProjectId) => void {
  const ctx = useContext(LikeC4ProjectsContext)
  if (!ctx) {
    return emptyOnProjectChange
  }
  return ctx.onProjectChange
}

const emptyContext: LikeC4ProjectsContext = {
  projects: emptyProjects,
  onProjectChange: emptyOnProjectChange,
}
/**
 * @returns The callback to change current project.
 */
export function useLikeC4ProjectsContext(): LikeC4ProjectsContext {
  return useContext(LikeC4ProjectsContext) ?? emptyContext
}

/**
 * @returns True if there are more than one project available in the context.
 */
export function useHasProjects(): boolean {
  const ctx = useContext(LikeC4ProjectsContext)
  if (!ctx) {
    return false
  }
  return ctx.projects.length > 1
}

/**
 * @returns Current project id, as provided by LikeC4Model
 */
export function useLikeC4ProjectId(): ProjectId {
  const ctx = useContext(LikeC4ModelContext)
  if (!ctx) {
    throw new Error('No LikeC4ModelProvider found')
  }
  return ctx.projectId as ProjectId
}

/**
 * Returns current LikeC4 project.
 * Requires both LikeC4ModelProvider and LikeC4ProjectsProvider in the tree.*
 */
export function useLikeC4Project(): LikeC4Project {
  const projectId = useLikeC4ProjectId()
  const projectsCtx = useContext(LikeC4ProjectsContext)
  if (!projectsCtx) {
    throw new Error('No LikeC4ProjectsProvider found')
  }
  const project = projectsCtx.projects.find(p => p.id === projectId)
  if (!project) {
    throw new Error(`Project with id '${projectId}' not found in LikeC4ProjectsProvider`)
  }
  return project
}
