import type { NonEmptyReadonlyArray, ProjectId } from '@likec4/core'
import { BiMap, invariant, nonNullable } from '@likec4/core'
import { type FileSystemNode, type LangiumDocument, URI, WorkspaceCache } from 'langium'
import { hasAtLeast, map, pipe, prop, sortBy } from 'remeda'
import { hasProtocol, joinRelativeURL, parseFilename, withoutProtocol, withProtocol } from 'ufo'
import { parseConfigJson, ProjectConfig } from '../config'
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
    '.likec4rc',
    '.likec4.config.json',
    'likec4.config.json',
  ]

  /**
   * The mapping between project config files and project IDs.
   */
  private projectIdToFolder = new BiMap<ProjectId, string>()

  // The mapping between document URIs and their corresponding project IDs.
  private _mappingsToProject: WorkspaceCache<string, ProjectId> | undefined

  /**
   * Registered projects.
   * Sorted descending by the number of segments in the folder path.
   * This ensures that the most specific project is used for a document.
   */
  private _projects = [] as Array<{
    id: ProjectId
    folder: string // URI.toString()
    config: ProjectConfig
    // configFile: URI | undefined
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

  getProject(projectId: ProjectId): {
    folder: URI
    config: Readonly<ProjectConfig>
  } {
    if (projectId === ProjectsManager.DefaultProjectId) {
      const folder = this.services.workspace.WorkspaceManager.workspaceUri
      return {
        folder,
        config: {
          name: ProjectsManager.DefaultProjectId,
        },
      }
    }
    const project = nonNullable(this._projects.find(({ id }) => id === projectId), `Project "${projectId}" not found`)
    return {
      folder: URI.parse(project.folder),
      config: project.config,
    }
  }

  ensureProjectId(projectId?: ProjectId | undefined): ProjectId {
    if (projectId === ProjectsManager.DefaultProjectId) {
      return projectId
    }
    if (projectId) {
      invariant(this.projectIdToFolder.has(projectId), `Project ID ${projectId} is not registered`)
      return projectId
    }
    return nonNullable(
      this.defaultProjectId,
      () => `Specify exact project, known: [${[...this.projectIdToFolder.keys()].join(', ')}]`,
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
  async loadConfigFile(entry: FileSystemNode): Promise<boolean> {
    if (entry.isDirectory) {
      return false
    }
    const filename = parseFilename(entry.uri.fsPath, { strict: false })
    if (!filename) {
      return false
    }
    if (ProjectsManager.ConfigFileNames.includes(filename)) {
      await this.registerProject(entry.uri)
      return true
    }
    return false
  }

  async registerProject(configFile: URI): Promise<void>
  async registerProject(opts: { config: ProjectConfig; folderUri: URI | string }): Promise<void>
  async registerProject(opts: URI | { config: ProjectConfig; folderUri: URI | string }): Promise<void> {
    if (URI.isUri(opts)) {
      const configFile = opts as URI
      const cfg = await this.services.workspace.FileSystemProvider.readFile(configFile)
      const config = parseConfigJson(cfg)
      const path = joinRelativeURL(configFile.path, '..')
      const folderUri = configFile.with({ path })
      return this.registerProject({ config, folderUri })
    }
    const { config, folderUri } = opts
    const id = config.name as ProjectId
    if (this._projects.some(({ id: existingId }) => existingId === id)) {
      throw new Error(`Project ID ${id} already registered`)
    }
    let folder
    if (URI.isUri(folderUri)) {
      folder = folderUri.toString()
    } else {
      folder = hasProtocol(folderUri) ? folderUri : withProtocol(folderUri, 'file://')
    }
    this._projects = pipe(
      [...this._projects, { folder, config, id }],
      sortBy(
        [({ folder }) => withoutProtocol(folder).split('/').length, 'desc'],
      ),
    )
    this.projectIdToFolder.set(id, folder)
    logger.debug`registered project ${id} folder: ${folder})`
  }

  belongsTo(document: LangiumDocument | URI | string): ProjectId {
    let documentUri: string
    if (typeof document === 'string') {
      documentUri = hasProtocol(document) ? document : withProtocol(document, 'file://')
    } else if (URI.isUri(document)) {
      documentUri = document.toString()
    } else {
      documentUri = document.uri.toString()
    }
    return this.mappingsToProject.get(documentUri, () => this.getProjectId(documentUri))
  }

  private getProjectId(documentUri: string): ProjectId {
    const project = this._projects.find(({ folder }) => documentUri.toString().startsWith(folder))
    // If the document is not part of any project, assign it to the global project ID
    return project?.id ?? ProjectsManager.DefaultProjectId
  }

  protected get mappingsToProject(): WorkspaceCache<string, ProjectId> {
    this._mappingsToProject ??= new WorkspaceCache(this.services)
    return this._mappingsToProject
  }
}
