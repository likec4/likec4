import type { NonEmptyReadonlyArray, ProjectId } from '@likec4/core'
import { BiMap, invariant, nonNullable } from '@likec4/core'
import { type FileSystemNode, type LangiumDocument, URI, UriUtils, WorkspaceCache } from 'langium'
import { hasAtLeast, map, pipe, prop, sortBy } from 'remeda'
import { joinRelativeURL, parseFilename, withoutProtocol } from 'ufo'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'

const logger = mainLogger.getChild('ProjectsManager')

export class ProjectsManager {
  /**
   * The global project ID used for all documents
   * that are not part of a specific project.
   */
  static readonly DefaultProjectId = 'default' as ProjectId

  static readonly ConfigFileNames = [
    '.likec4.config.json',
    '.likec4.config.json5',
    'likec4.config.json',
    'likec4.config.json5',
  ]

  /**
   * The mapping between project config files and project IDs.
   */
  private projectIds = new BiMap<URI, ProjectId>()

  // The mapping between document URIs and their corresponding project IDs.
  private _mappingsToProject: WorkspaceCache<string, ProjectId> | undefined

  /**
   * Registered projects.
   * Sorted descending by the number of segments in the folder path.
   * This ensures that the most specific project is used for a document.
   */
  private _projects = [] as Array<{
    folder: string // URI.toString()
    configFile: URI
    id: ProjectId
  }>

  constructor(protected services: LikeC4SharedServices) {
    logger.debug`created`
  }

  get defaultProjectId(): ProjectId | undefined {
    if (this._projects.length > 1) {
      return undefined
    }
    return this._projects[0]?.id ?? ProjectsManager.DefaultProjectId
  }

  get all(): NonEmptyReadonlyArray<ProjectId> {
    if (hasAtLeast(this._projects, 1)) {
      return [
        ...map(this._projects, prop('id')),
        ProjectsManager.DefaultProjectId,
      ]
    }
    return [ProjectsManager.DefaultProjectId]
  }

  ensureProjectId(projectId?: ProjectId | undefined): ProjectId {
    if (projectId === ProjectsManager.DefaultProjectId) {
      return projectId
    }
    if (projectId) {
      invariant(this.projectIds.inverse.has(projectId), `Project ID ${projectId} is not registered`)
      return projectId
    }
    return nonNullable(
      this.defaultProjectId,
      () => `Specify exact project, known: [${[...this.projectIds.values()].join(', ')}]`,
    )
  }

  hasMultipleProjects(): boolean {
    return this._projects.length > 1
  }

  /**
   * Checks if the provided file system entry is a valid project config file.
   *
   * @param entry The file system entry to check
   * @returns {boolean} Returns true if the entry is a valid config file, false otherwise.
   */
  loadConfigFile(entry: FileSystemNode): boolean {
    if (entry.isDirectory) {
      return false
    }
    const filename = parseFilename(entry.uri.fsPath, { strict: false })
    if (!filename) {
      return false
    }
    if (ProjectsManager.ConfigFileNames.includes(filename)) {
      this.registerProject(entry.uri)
      return true
    }
    return false
  }

  registerProject(configFile: URI): void {
    const path = joinRelativeURL(configFile.path, '..')
    const folderUri = configFile.with({ path })
    let id = UriUtils.basename(folderUri) as ProjectId
    let seq = 1
    while (this.projectIds.inverse.has(id)) {
      id = `${UriUtils.basename(folderUri)}${seq++}` as ProjectId
    }
    const folder = folderUri.toString()
    this._projects = pipe(
      [...this._projects, { folder, configFile, id }],
      sortBy(
        [({ folder }) => withoutProtocol(folder).split('/').length, 'desc'],
      ),
    )

    this.projectIds.set(folderUri, id)
    logger.debug`registered project ${id} (${configFile.fsPath})`
  }

  belongsTo(document: LangiumDocument | URI | string): ProjectId {
    let documentUri: string
    if (typeof document === 'string') {
      documentUri = document
    } else if (URI.isUri(document)) {
      documentUri = document.toString()
    } else {
      documentUri = document.uri.toString()
    }
    return this.mappingsToProject.get(documentUri, () => this.getProjectId(documentUri))
  }

  private getProjectId(documentUri: string): ProjectId {
    const project = this._projects.find(({ folder }) => documentUri.startsWith(folder))
    // If the document is not part of any project, assign it to the global project ID
    return project?.id ?? ProjectsManager.DefaultProjectId
  }

  protected get mappingsToProject(): WorkspaceCache<string, ProjectId> {
    return this._mappingsToProject ??= new WorkspaceCache(this.services)
  }
}
