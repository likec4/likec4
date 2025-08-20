import type { NonEmptyReadonlyArray, ProjectId } from '@likec4/core'
import { BiMap, delay, invariant, memoizeProp, nonNullable } from '@likec4/core'
import { loggable } from '@likec4/log'
import { deepEqual } from 'fast-equals'
import {
  type Cancellation,
  type FileSystemNode,
  type LangiumDocument,
  interruptAndCheck,
  URI,
  WorkspaceCache,
} from 'langium'
import { UriUtils } from 'langium'
import PQueue from 'p-queue'
import picomatch from 'picomatch'
import { hasAtLeast, isNullish, isTruthy, map, pickBy, pipe, prop, sortBy } from 'remeda'
import type { Tagged } from 'type-fest'
import {
  hasProtocol,
  joinRelativeURL,
  normalizeURL,
  parseFilename,
  withoutProtocol,
  withProtocol,
  withTrailingSlash,
} from 'ufo'
import { parseConfigJson, ProjectConfig, validateConfig } from '../config'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'

const logger = mainLogger.getChild('ProjectsManager')

/**
 * A tagged string that represents a project folder URI
 * Always has trailing slash.
 */
export type ProjectFolder = Tagged<string, 'ProjectFolder'>
export function ProjectFolder(folder: URI | string): ProjectFolder {
  if (!URI.isUri(folder)) {
    //   folder = folder.toString()
    // } else {
    // folder = folder.startsWith('file://') ? folder : URI.file(folder).toString()
    folder = URI.file(folder).toString()
  }
  return withTrailingSlash(UriUtils.normalize(folder)) as ProjectFolder
}

interface ProjectData {
  id: ProjectId
  config: ProjectConfig
  folder: ProjectFolder // URI.toString()
  folderUri: URI
  exclude?: picomatch.Matcher
}

export interface Project {
  id: ProjectId
  folderUri: URI
  config: ProjectConfig
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
  private _projects = [] as Array<ProjectData>

  private excludedDocuments: WeakMap<LangiumDocument, boolean> = new WeakMap()

  private defaultGlobalProject = {
    id: ProjectsManager.DefaultProjectId,
    config: {
      name: ProjectsManager.DefaultProjectId,
      exclude: ['**/node_modules/**'],
    },
    exclude: picomatch('**/node_modules/**', { dot: true }),
  }

  private reloadProjectsLimiter = new PQueue({
    concurrency: 1,
    timeout: 20_000,
  })

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

  getProject(arg: ProjectId | LangiumDocument): Project {
    const id = typeof arg === 'string' ? arg : (arg.likec4ProjectId || this.belongsTo(arg))
    if (id === ProjectsManager.DefaultProjectId) {
      let folderUri
      try {
        folderUri = this.services.workspace.WorkspaceManager.workspaceUri
      } catch (error) {
        logger.warn('Failed to get workspace URI, using default folder', { error })
        folderUri = URI.file('')
        // ignore - workspace not initialized
      }
      return {
        id: ProjectsManager.DefaultProjectId,
        config: this.defaultGlobalProject.config,
        folderUri,
      }
    }
    const {
      config,
      folderUri,
    } = nonNullable(this._projects.find(p => p.id === id), `Project "${id}" not found`)
    return {
      id,
      folderUri,
      config,
    }
  }

  ensureProjectId(projectId?: ProjectId | undefined): ProjectId {
    if (projectId === ProjectsManager.DefaultProjectId) {
      return this.defaultProjectId ?? ProjectsManager.DefaultProjectId
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

  checkIfExcluded(document: LangiumDocument | URI | string): boolean {
    if (typeof document === 'string' || URI.isUri(document)) {
      let docUriAsString = typeof document === 'string' ? document : document.toString()
      const project = this.findProjectForDocument(docUriAsString)
      return project.exclude ? project.exclude(withoutProtocol(docUriAsString)) : false
    }
    let isExcluded = this.excludedDocuments.get(document)
    if (isExcluded === undefined) {
      isExcluded = this.checkIfExcluded(document.uri)
      this.excludedDocuments.set(document, isExcluded)
    }
    return isExcluded
  }

  /**
   * Checks if it is a config file and it is not excluded by default exclude pattern
   *
   * @param entry The file system entry to check
   */
  isConfigFile(entry: URI): boolean {
    const filename = parseFilename(entry.toString(), { strict: false })?.toLowerCase()
    const isConfigFile = !!filename && ProjectsManager.ConfigFileNames.includes(filename)
    if (isConfigFile) {
      if (this.defaultGlobalProject.exclude(entry.path)) {
        logger.debug`exclude config file ${entry.path}`
        return false
      }
    }
    return isConfigFile
  }

  /**
   * Checks if the provided file system entry is a valid project config file.
   *
   * @param entry The file system entry to check
   */
  async loadConfigFile(entry: FileSystemNode): Promise<ProjectData | undefined> {
    if (entry.isDirectory) {
      return undefined
    }
    if (this.isConfigFile(entry.uri)) {
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

  async registerProject(configFile: URI): Promise<ProjectData>
  async registerProject(opts: { config: ProjectConfig; folderUri: URI | string }): Promise<ProjectData>
  async registerProject(opts: URI | { config: ProjectConfig; folderUri: URI | string }): Promise<ProjectData> {
    if (URI.isUri(opts)) {
      const configFile = opts as URI
      const cfg = await this.services.workspace.FileSystemProvider.readFile(configFile)
      const config = parseConfigJson(cfg)
      const path = joinRelativeURL(configFile.path, '..')
      const folderUri = configFile.with({ path })
      return await this.registerProject({ config, folderUri })
    }
    const config = pickBy(validateConfig(opts.config), isTruthy)
    const { folderUri } = opts
    const folder = ProjectFolder(folderUri)

    let project = this._projects.find(p => p.folder === folder)

    if (project && deepEqual(project.config, config)) {
      return project
    }

    // if project exists but config is different, we need to reset project IDs
    let mustReset = !!project && !deepEqual(project.config, config)

    let id: ProjectId

    if (!project) {
      if (this.projectIdToFolder.has(config.name as ProjectId)) {
        logger.warn`Project "${config.name}" already exists, generating unique ID`
      }
      id = this.uniqueProjectId(config.name)
      project = {
        id,
        config,
        folder,
        folderUri: URI.parse(folder),
      }
      // if there is any project within subfolder or parent folder
      // we need to reset assigned to documents project IDs
      mustReset = this._projects.some(p => p.folder.startsWith(folder) || folder.startsWith(p.folder))

      this._projects = pipe(
        [...this._projects, project],
        sortBy(
          [({ folder }) => withoutProtocol(folder).split('/').length, 'desc'],
        ),
      )
      logger.info`register project ${project.id} folder: ${folder}`
    } else {
      if (project.config.name !== config.name) {
        this.projectIdToFolder.delete(project.id)
        logger.info`unregister project ${project.id} folder: ${folder}`
        id = this.uniqueProjectId(config.name)
        project.id = id
        logger.info`re-register project ${project.id} folder: ${folder}`
      } else {
        id = project.id
        logger.info`update project ${project.id} on config change`
      }
      project.config = config
    }

    if (isNullish(config.exclude)) {
      project.exclude = this.defaultGlobalProject.exclude
    } else if (hasAtLeast(config.exclude, 1)) {
      project.exclude = picomatch(config.exclude, { dot: true })
    }

    this.projectIdToFolder.set(project.id, folder)

    if (mustReset) {
      this.resetProjectIds()
    }

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

  async reloadProjects(token?: Cancellation.CancellationToken): Promise<void> {
    const folders = this.services.workspace.WorkspaceManager.workspaceFolders
    if (!folders) {
      logger.warn('No workspace folders found')
      return
    }
    if (this.reloadProjectsLimiter.size + this.reloadProjectsLimiter.pending > 0) {
      logger.debug`reload projects is already queued`
      return
    }
    // this task debounces reload projects
    this.reloadProjectsLimiter.add(async () => {
      await delay(100)
    })

    // this task does the actual reload
    this.reloadProjectsLimiter.add(async () => {
      if (token) {
        await interruptAndCheck(token)
      }
      logger.debug`reload projects`
      const configFiles = [] as FileSystemNode[]
      for (const folder of folders) {
        try {
          const files = await this.services.workspace.FileSystemProvider.scanProjectFiles(URI.parse(folder.uri))
          for (const file of files) {
            if (file.isFile && this.isConfigFile(file.uri)) {
              configFiles.push(file)
            }
          }
        } catch (error) {
          logger.error('Failed to load config file', { error })
        }
      }
      if (configFiles.length === 0 && this._projects.length !== 0) {
        logger.warning('No config files found, but some projects were registered before')
      }
      this._projects = []
      this.projectIdToFolder.clear()
      for (const entry of configFiles) {
        try {
          await this.registerProject(entry.uri)
        } catch (error) {
          logger.error('Failed to load config file', { error })
        }
      }
      this.resetProjectIds()

      const docs = this.services.workspace.LangiumDocuments.all.map(d => d.uri).toArray()
      logger.info('invalidate and rebuild documents {docs}', { docs: docs.length })
      await this.services.workspace.DocumentBuilder.update(docs, [])
    })
  }

  protected uniqueProjectId(name: string): ProjectId {
    let id = name as ProjectId
    let i = 1
    while (this.projectIdToFolder.has(id)) {
      id = `${name}-${i++}` as ProjectId
    }
    return id
  }

  protected resetProjectIds(): void {
    this.mappingsToProject.clear()
    this.excludedDocuments = new WeakMap()
    this.services.workspace.LangiumDocuments.resetProjectIds()
  }

  protected findProjectForDocument(documentUri: string) {
    return this.mappingsToProject.get(documentUri, () => {
      const project = this._projects.find(({ folder }) => documentUri.startsWith(folder))
      // If the document is not part of any project, assign it to the global project ID
      return project ?? this.defaultGlobalProject
    })
  }

  // The mapping between document URIs and their corresponding project ID
  // Lazy-created due to initialization order of the LanguageServer
  protected get mappingsToProject(): WorkspaceCache<string, Pick<ProjectData, 'id' | 'config' | 'exclude'>> {
    return memoizeProp(this, '_mappingsToProject', () => new WorkspaceCache(this.services))
  }
}
