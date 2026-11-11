import type { ProjectId } from '@likec4/core/types'
import type { LikeC4SharedServices } from '../module'
import type { ExternalProjectId } from './ExternalProjects'

/**
 * Result of resolving an import name (`import ... from 'name'`):
 * - `workspace` - a project of the workspace, `projectId` is its real id
 * - `external` - an external project instance, `projectId` is its internal id (starts with `#`)
 */
export type ResolvedDependency =
  | {
    kind: 'workspace'
    projectId: ProjectId
  }
  | {
    kind: 'external'
    projectId: ExternalProjectId
  }

/**
 * Resolves the project name used in `import ... from 'name'` in the context of the consumer project.
 *
 * The name written by the consumer stays the key of `imports` and the `@name.` prefix in the consumer model;
 * the resolved project id stays inside the language server.
 */
export class DependencyResolver {
  constructor(protected services: LikeC4SharedServices) {}

  /**
   * Resolves the import name in the context of the consumer project.
   * Synchronous: reads only registered projects and loaded instances.
   *
   * @param consumer - id of the project that imports
   * @param name - project name as written in `from '…'`
   * @returns the resolved project, or undefined if the name is unknown
   */
  resolve(consumer: ProjectId, name: string): ResolvedDependency | undefined {
    // Without `dependencies`, the name is the id of a workspace project
    const projectId = name as ProjectId
    if (this.services.workspace.ProjectsManager.all.includes(projectId)) {
      return { kind: 'workspace', projectId }
    }
    return undefined
  }
}
