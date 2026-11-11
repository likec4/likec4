import type { ProjectId } from '@likec4/core/types'
import type { LangiumDocument, URI } from 'langium'
import type { LikeC4SharedServices } from '../module'
import type { ProjectData, ProjectsManager } from './ProjectsManager'

type DocOrUri = LangiumDocument | string | URI

/**
 * Facade for document ownership and inclusion.
 *
 * Has the same signatures as the corresponding methods of {@link ProjectsManager},
 * and is the single entry point for these questions outside of the workspace:
 * it is where external project instances (see `ExternalProjects`) are taken into account,
 * without changing {@link ProjectsManager}.
 *
 * Currently delegates to {@link ProjectsManager} one-to-one.
 */
export class ProjectsLookup {
  constructor(protected services: LikeC4SharedServices) {}

  protected get projectsManager(): ProjectsManager {
    return this.services.workspace.ProjectsManager
  }

  /**
   * Determines which project the given document belongs to.
   * If the document does not belong to any project, returns the default project ID.
   */
  ownerProjectId(document: DocOrUri): ProjectId {
    return this.projectsManager.ownerProjectId(document)
  }

  /**
   * Returns the project by id, or the project that owns the document.
   */
  getProject(arg: ProjectId | LangiumDocument): ProjectData {
    return this.projectsManager.getProject(arg)
  }

  /**
   * Checks if the specified document is included by the project:
   * - if the document belongs to the project and is not excluded
   * - if the document is included by the project
   */
  isIncluded(projectId: ProjectId, document: DocOrUri): boolean {
    return this.projectsManager.isIncluded(projectId, document)
  }

  /**
   * Checks if given document (or URI) must be excluded from processing.
   */
  isExcluded(document: DocOrUri): boolean
  /**
   * Checks if given document (or URI) must be excluded in the context of the project.
   */
  isExcluded(projectId: ProjectId, document: DocOrUri): boolean
  isExcluded(...args: [DocOrUri] | [ProjectId, DocOrUri]): boolean {
    if (args.length === 1) {
      return this.projectsManager.isExcluded(args[0])
    }
    return this.projectsManager.isExcluded(args[0], args[1])
  }
}
