import type { ProjectId } from '@likec4/core/types'
import type { LangiumDocument, URI } from 'langium'
import type { LikeC4SharedServices } from '../module'
import { type ExternalProjects, isExternalProjectId } from './ExternalProjects'
import type { ProjectData, ProjectsManager } from './ProjectsManager'

type DocOrUri = LangiumDocument | string | URI

/**
 * Facade for document ownership and inclusion.
 *
 * Has the same signatures as the corresponding methods of {@link ProjectsManager},
 * and is the single entry point for these questions outside of the workspace.
 *
 * External project instances (see {@link ExternalProjects}) are asked first, then {@link ProjectsManager}:
 * - a document of an external project is owned by that project, and is included only by it;
 * - documents of external projects are indexed and linked, but excluded from processing
 *   (not validated, no diagnostics are published, not part of user documents),
 *   the same way as the built-in library.
 */
export class ProjectsLookup {
  constructor(protected services: LikeC4SharedServices) {}

  protected get projectsManager(): ProjectsManager {
    return this.services.workspace.ProjectsManager
  }

  protected get externalProjects(): ExternalProjects {
    return this.services.workspace.ExternalProjects
  }

  /**
   * Determines which project the given document belongs to.
   * If the document belongs to an external project, returns its internal id.
   * If the document does not belong to any project, returns the default project ID.
   */
  ownerProjectId(document: DocOrUri): ProjectId {
    return this.externalProjects.ownerProjectId(document) ?? this.projectsManager.ownerProjectId(document)
  }

  /**
   * Returns the project by id, or the project that owns the document.
   * External projects are returned by their internal id.
   */
  getProject(arg: ProjectId | LangiumDocument): ProjectData {
    if (typeof arg === 'string') {
      return this.externalProjects.get(arg) ?? this.projectsManager.getProject(arg)
    }
    return this.externalProjects.ownerOf(arg) ?? this.projectsManager.getProject(arg)
  }

  /**
   * Checks if the specified document is included by the project:
   * - if the document belongs to the project and is not excluded
   * - if the document is included by the project
   *
   * An external project includes only its own documents,
   * and documents of external projects are not included by workspace projects.
   */
  isIncluded(projectId: ProjectId, document: DocOrUri): boolean {
    if (isExternalProjectId(projectId)) {
      return this.externalProjects.ownerProjectId(document) === projectId
    }
    if (this.externalProjects.ownerProjectId(document)) {
      return false
    }
    return this.projectsManager.isIncluded(projectId, document)
  }

  /**
   * Checks if given document (or URI) must be excluded from processing.
   * Documents of external projects are excluded (they are indexed, but not validated).
   */
  isExcluded(document: DocOrUri): boolean
  /**
   * Checks if given document (or URI) must be excluded in the context of the project.
   */
  isExcluded(projectId: ProjectId, document: DocOrUri): boolean
  isExcluded(...args: [DocOrUri] | [ProjectId, DocOrUri]): boolean {
    if (args.length === 1) {
      if (this.externalProjects.ownerProjectId(args[0])) {
        return true
      }
      return this.projectsManager.isExcluded(args[0])
    }
    const [projectId, document] = args
    if (isExternalProjectId(projectId)) {
      return this.externalProjects.ownerProjectId(document) !== projectId
    }
    if (this.externalProjects.ownerProjectId(document)) {
      return true
    }
    return this.projectsManager.isExcluded(projectId, document)
  }
}
