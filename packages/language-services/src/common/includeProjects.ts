import type { ProjectsManager } from '@likec4/language-server'
import { ProjectId } from '@likec4/core/types'
import { isString, unique } from 'remeda'

/**
 * Id of the synthetic project the language server appends to `projectsManager.all`
 * (`ProjectsManager.DefaultProjectId`, not exported as a value from `@likec4/language-server`)
 */
const DEFAULT_PROJECT_ID = ProjectId('default')

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
 * Checks that included projects are registered.
 * The synthetic `default` project can be included only when there are no other projects:
 * otherwise it stands for another project, and the instance would return a project it does not include.
 *
 * @throws if some of the ids are not registered, or `default` is included next to named projects
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
  if (included.includes(DEFAULT_PROJECT_ID) && known.size > 1) {
    const named = [...known].filter(id => id !== DEFAULT_PROJECT_ID)
    throw new Error(
      `includeProjects must name a project instead of "${DEFAULT_PROJECT_ID}", known: [${named.join(', ')}]`,
    )
  }
}
