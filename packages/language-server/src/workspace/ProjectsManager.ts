import type { NonEmptyReadonlyArray, ProjectId } from '@likec4/core'
import { BiMap, invariant, nonNullable } from '@likec4/core'
import { loggable } from '@likec4/log'
import { type FileSystemNode, type LangiumDocument, URI, WorkspaceCache } from 'langium'
import picomatch from 'picomatch/posix'
import { hasAtLeast, isNullish, map, pipe, prop, sortBy } from 'remeda'
import {
  hasProtocol,
  joinRelativeURL,
  parseFilename,
  withoutProtocol,
  withProtocol,
} from 'ufo'
import { parseConfigJson, ProjectConfig, validateConfig } from '../config'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'

const logger = mainLogger.getChild('ProjectsManager')

interface Project {
  id: ProjectId
  config: ProjectConfig
  folder: string // URI.toString()
  exclude?: picomatch.Matcher
}

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

  /**
   * Registered projects.
   * Sorted descending by the number of segments in the folder path.
   * This ensures that the most specific project is used for a document.
   */
  private _projects = [] as Array<Project>

  private defaultGlobalProject = {
    id: ProjectsManager.DefaultProjectId,
    config: {
      name: ProjectsManager.DefaultProjectId,
      exclude: ['**/node_modules/**/*'],
    },
    exclude: picomatch('**/node_modules/**/*', {
      dot: true,
    }),
  }

  constructor(protected services: LikeC4SharedServices) {
    logger.debug`created`
  }

  /**
   * Returns:
   *  - the default project ID if there are no projects.
   *  - the ID of the only project
   *  - undefined if there are multiple projects.
   */
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

  getProject(arg: ProjectId | LangiumDocument): {
    id: ProjectId
    folder: URI
    config: Readonly<ProjectConfig>
  } {
    const id = typeof arg === 'string' ? arg : (arg.likec4ProjectId || this.belongsTo(arg))
    if (id === ProjectsManager.DefaultProjectId) {
      let folder
      try {
        folder = this.services.workspace.WorkspaceManager.workspaceUri
      } catch (error) {
        logger.warn('Failed to get workspace URI, using default folder', { error })
        folder = URI.file('')
        // ignore - workspace not initialized
      }
      return {
        id: ProjectsManager.DefaultProjectId,
        config: this.defaultGlobalProject.config,
        folder,
      }
    }
    const {
      config,
      folder,
    } = nonNullable(this._projects.find(p => p.id === id), `Project "${id}" not found`)
    return {
      id,
      folder: URI.parse(folder),
      config,
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

  checkIfExcluded(documentUri: URI): boolean {
    let docUriAsString = documentUri.toString()
    const project = this.findProjectForDocument(docUriAsString)
    return project.exclude ? project.exclude(withoutProtocol(docUriAsString)) : false
  }

  isConfigFile(entry: FileSystemNode): boolean {
    const filename = parseFilename(entry.uri.toString(), { strict: false })?.toLowerCase()
    return !!filename && ProjectsManager.ConfigFileNames.includes(filename)
  }

  /**
   * Checks if the provided file system entry is a valid project config file.
   *
   * @param entry The file system entry to check
   */
  async loadConfigFile(entry: FileSystemNode): Promise<Project | undefined> {
    if (entry.isDirectory) {
      return undefined
    }
    if (this.isConfigFile(entry)) {
      try {
        return await this.registerProject(entry.uri)
      } catch (error) {
        this.services.lsp.Connection?.window.showErrorMessage(
          `LikeC4: Failed to register project at ${entry.uri.toString()}\n\n${loggable(error)}`,
        )
        logger.error('Failed to register project at {uri}', { uri: entry.uri.toString(), error })
        return undefined
      }
    }
    return undefined
  }

  async registerProject(configFile: URI): Promise<Project>
  async registerProject(opts: { config: ProjectConfig; folderUri: URI | string }): Promise<Project>
  async registerProject(opts: URI | { config: ProjectConfig; folderUri: URI | string }): Promise<Project> {
    if (URI.isUri(opts)) {
      const configFile = opts as URI
      const cfg = await this.services.workspace.FileSystemProvider.readFile(configFile)
      const config = parseConfigJson(cfg)
      const path = joinRelativeURL(configFile.path, '..')
      const folderUri = configFile.with({ path })
      return this.registerProject({ config, folderUri })
    }
    const config = validateConfig(opts.config)
    const { folderUri } = opts
    let id = config.name as ProjectId
    let i = 1
    while (this.projectIdToFolder.has(id)) {
      id = `${config.name}-${i++}` as ProjectId
    }
    let folder
    if (URI.isUri(folderUri)) {
      folder = folderUri.toString()
    } else {
      folder = hasProtocol(folderUri) ? folderUri : withProtocol(folderUri, 'file://')
    }
    const project: Project = {
      id,
      config,
      folder,
    }
    if (isNullish(config.exclude)) {
      project.exclude = this.defaultGlobalProject.exclude
    } else if (hasAtLeast(config.exclude, 1)) {
      project.exclude = picomatch(config.exclude, {
        dot: true,
      })
    }
    this._projects = pipe(
      [...this._projects, project],
      sortBy(
        [({ folder }) => withoutProtocol(folder).split('/').length, 'desc'],
      ),
    )
    this.projectIdToFolder.set(id, folder)
    logger.info`register project ${id} folder: ${folder}`

    this.mappingsToProject.clear()

    return project
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
    return this.findProjectForDocument(documentUri).id
  }

  protected findProjectForDocument(documentUri: string): Omit<Project, 'folder'> {
    return this.mappingsToProject.get(documentUri, () => {
      const project = this._projects.find(({ folder }) => documentUri.startsWith(folder))
      // If the document is not part of any project, assign it to the global project ID
      return project ?? this.defaultGlobalProject
    })
  }

  // The mapping between document URIs and their corresponding project ID
  // Lazy-created due to initialization order of the LanguageServer
  private _mappingsToProject: WorkspaceCache<string, Omit<Project, 'folder'>> | undefined
  protected get mappingsToProject(): WorkspaceCache<string, Omit<Project, 'folder'>> {
    this._mappingsToProject ??= new WorkspaceCache(this.services)
    return this._mappingsToProject
  }
}
