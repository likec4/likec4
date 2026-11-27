import type { ProjectsManager } from '@likec4/language-server'
import { ProjectId } from '@likec4/core/types'
import { isString, unique } from 'remeda'

/**
 * Normalizes {@link FromWorkspaceOptions.includeProjects}
 *
 * @returns unique project ids, or `undefined` if all projects are available
 * @throws if the list is empty
 */
export function normalizeIncludeProjects(
  includeProjects: string | ReadonlyArray<string> | undefined,
): ReadonlyArray<ProjectId> | undefined {
  if (includeProjects === undefined) {
    return undefined
  }
  const ids = unique(isString(includeProjects) ? [includeProjects] : [...includeProjects])
  if (ids.length === 0) {
    throw new Error(`includeProjects must not be empty`)
  }
  return ids.map(id => ProjectId(id))
}

/**
 * Checks that included projects are registered
 *
 * @throws if some of the ids are not registered
 */
export function validateIncludeProjects(
  projectsManager: ProjectsManager,
  included: ReadonlyArray<ProjectId>,
): void {
  const known = new Set<string>(projectsManager.all)
  const unknown = included.filter(id => !known.has(id))
  if (unknown.length > 0) {
    throw new Error(
      `Unknown projects in includeProjects: [${unknown.join(', ')}], known: [${[...known].join(', ')}]`,
    )
  }
}
