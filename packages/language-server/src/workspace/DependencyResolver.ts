import type { ImportedProjectMeta, ProjectId } from '@likec4/core/types'
import { UriUtils } from 'langium'
import { logWarnError } from '../logger'
import type { LikeC4SharedServices } from '../module'
import type { ExternalProjectId } from './ExternalProjects'
import { type ProjectData, ProjectFolder, ProjectsManager } from './ProjectsManager'

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
 * Resolved import name together with the metadata of the imported project,
 * see {@link DependencyResolver.resolveWithMeta}
 */
export interface ResolvedDependencyWithMeta {
  dependency: ResolvedDependency
  /**
   * Metadata of the imported project, for `importedProjects` of the consumer model
   */
  meta: ImportedProjectMeta
}

/**
 * Resolves the project name used in `import ... from 'name'` in the context of the consumer project.
 *
 * Resolution order:
 * 1. If the consumer declares the name in `dependencies`, the entry wins:
 *    - the folder of a workspace project resolves to that project
 *    - the folder of a registered external project resolves to that instance
 *    - otherwise the name is unknown (no fallback to the workspace search by name)
 * 2. Without an entry, the name is the id of a workspace project (as before `dependencies`).
 *
 * The name written by the consumer stays the key of `imports` and the `@name.` prefix in the consumer model;
 * the resolved project id stays inside the language server.
 *
 * Self-imports are resolved as well (to the consumer itself): callers decide how to handle them.
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
    return this.resolveWithMeta(consumer, name)?.dependency
  }

  /**
   * Same as {@link resolve}, and additionally returns the metadata of the imported project:
   * its original name and the source it comes from.
   *
   * @param consumer - id of the project that imports
   * @param name - project name as written in `from '…'`
   * @returns the resolved project with metadata, or undefined if the name is unknown
   */
  resolveWithMeta(consumer: ProjectId, name: string): ResolvedDependencyWithMeta | undefined {
    const projectsManager = this.services.workspace.ProjectsManager
    const consumerProject = this.consumerProject(consumer)
    const dependencies = consumerProject?.config.dependencies

    // No entry in `dependencies`: the name is the id of a workspace project
    if (!consumerProject || !dependencies || !Object.hasOwn(dependencies, name)) {
      const projectId = name as ProjectId
      if (!projectsManager.all.includes(projectId)) {
        return undefined
      }
      return this.workspaceDependency(projectId)
    }

    const dependencyPath = dependencies[name]
    if (!dependencyPath) {
      return undefined
    }
    const folder = ProjectFolder(UriUtils.joinPath(consumerProject.folderUri, dependencyPath))

    // Folder of a workspace project
    for (const projectId of projectsManager.all) {
      if (projectId === ProjectsManager.DefaultProjectId) {
        continue
      }
      if (projectsManager.getProject(projectId).folder === folder) {
        return this.workspaceDependency(projectId)
      }
    }

    // Otherwise, an external instance loaded from the folder
    const external = this.services.workspace.ExternalProjects.findByFolder(folder)
    if (external) {
      return {
        dependency: {
          kind: 'external',
          projectId: external.id,
        },
        meta: {
          name: external.config.name,
          source: { kind: 'local', path: dependencyPath },
        },
      }
    }
    return undefined
  }

  protected consumerProject(consumer: ProjectId): ProjectData | undefined {
    try {
      return this.services.workspace.ProjectsLookup.getProject(consumer)
    } catch (e) {
      logWarnError(e)
      return undefined
    }
  }

  protected workspaceDependency(projectId: ProjectId): ResolvedDependencyWithMeta {
    const project = this.services.workspace.ProjectsManager.getProject(projectId)
    return {
      dependency: {
        kind: 'workspace',
        projectId,
      },
      meta: {
        name: project.config.name,
        source: { kind: 'workspace', projectId },
      },
    }
  }
}
