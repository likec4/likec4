import {
  type IncludeConfig,
  type LikeC4ProjectConfig,
  type LikeC4ProjectConfigInput,
  isLikeC4Config,
  normalizeIncludeConfig,
  validateProjectConfig,
} from '@likec4/config'
import type { NonEmptyArray, NonEmptyReadonlyArray } from '@likec4/core'
import type { ProjectId, scalar } from '@likec4/core/types'
import { BiMap, DefaultMap, invariant, memoizeProp, nonNullable } from '@likec4/core/utils'
import { wrapError } from '@likec4/log'
import { deepEqual } from 'fast-equals'
import {
  type Cancellation,
  type LangiumDocument,
  interruptAndCheck,
  URI,
  WorkspaceCache,
} from 'langium'
import picomatch from 'picomatch'
import { hasAtLeast, isNullish, map, pipe, prop, sortBy } from 'remeda'
import type { Tagged } from 'type-fest'
import {
  cleanDoubleSlashes,
  isRelative,
  joinRelativeURL,
  joinURL,
  parseFilename,
  withoutProtocol,
  withTrailingSlash,
} from 'ufo'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'

const logger = mainLogger.getChild('ProjectsManager')

function normalizeUri(uri: LangiumDocument | string | URI): string {
  if (URI.isUri(uri)) {
    return uri.toString()
  } else if (typeof uri === 'string') {
    // TODO: handle non-file URIs, i.e. vscode-remote://
    return uri.startsWith('file://') ? uri : URI.file(uri).toString()
  } else {
    return uri.uri.toString()
  }
}

/**
 * Returns a predicate that checks if the given path is included in the project folder.
 */
function isParentFolderFor(uri: LangiumDocument | string | URI) {
  const path = normalizeUri(uri)
  return (p: {
    folder: ProjectFolder
  }) => path.startsWith(p.folder)
}

/**
 * A tagged string that represents a project folder URI
 * Always has trailing slash.
 */
export type ProjectFolder = Tagged<string, 'ProjectFolder'>
export function ProjectFolder(folder: URI | string): ProjectFolder {
  folder = normalizeUri(folder)
  return withTrailingSlash(folder) as ProjectFolder
}

interface ProjectData {
  id: scalar.ProjectId
  config: LikeC4ProjectConfig
  folder: ProjectFolder // URI.toString()
  folderUri: URI
  // exclude?: (path: string) => boolean
  exclude?: picomatch.Matcher
  /**
   * Resolved include paths with both URI and folder string representations.
   * These are additional directories that are part of this project.
   */
  includePaths?: NonEmptyArray<{
    uri: URI
    folder: ProjectFolder
  }>
  /**
   * Normalized include configuration (paths, maxDepth, fileThreshold).
   */
  includeConfig: IncludeConfig
}

export interface Project {
  id: scalar.ProjectId
  folderUri: URI
  config: LikeC4ProjectConfig
  /**
   * Resolved include paths as URIs (if configured).
   */
  includePaths?: NonEmptyReadonlyArray<URI>
}

const DefaultProject = {
  id: 'default' as scalar.ProjectId,
  config: {
    name: 'default',
    exclude: ['**/node_modules/**'],
  },
  exclude: picomatch('**/node_modules/**', { dot: true }),
  includeConfig: { paths: [], maxDepth: 3, fileThreshold: 30 } as IncludeConfig,
}

export class ProjectsManager {
  /**
   * The global project ID used for all documents
   * that are not part of a specific project.
   */
  static readonly DefaultProjectId = DefaultProject.id

  /**
   * Configured default project ID.
   * (it is used in CLI and Vite plugin)
   */
  #defaultProjectId: scalar.ProjectId | undefined = undefined
  /**
   * Cached default project.
   */
  #defaultProject: ProjectData | undefined = undefined

  /**
   * The mapping between project config files and project IDs.
   */
  #projectIdToFolder = new BiMap<scalar.ProjectId, string>()

  /**
   * Registered projects.
   * Sorted descending by the number of segments in the folder path.
   * This ensures that the most specific project is used for a document.
   */
  #projects = [] as Array<ProjectData>

  /**
   * This is a cached lookup for performance.
   */
  #lookupById = new DefaultMap((id: scalar.ProjectId) => {
    return nonNullable(
      this.#projects.find(p => p.id === id),
      `Project "${id}" not found`,
    )
  })

  #excludedDocuments: WeakMap<LangiumDocument, boolean> = new WeakMap()

  constructor(protected services: LikeC4SharedServices) {
    logger.debug`created`
  }

  /**
   * Returns:
   *  - configured default project ID if set
   *  - the default project ID if there are no projects.
   *  - the ID of the only project
   *  - undefined if there are multiple projects.
   */
  get defaultProjectId(): scalar.ProjectId | undefined {
    if (this.#defaultProjectId) {
      return this.#defaultProjectId
    }
    if (this.#projects.length > 1) {
      return undefined
    }
    return this.#projects[0]?.id ?? ProjectsManager.DefaultProjectId
  }

  set defaultProjectId(id: string | scalar.ProjectId | undefined) {
    if (id === this.#defaultProjectId) {
      return
    }
    this.#defaultProject = undefined
    if (!id || id === ProjectsManager.DefaultProjectId) {
      logger.debug`reset default project ID`
      this.#defaultProjectId = undefined
      return
    }
    invariant(this.#projects.find(p => p.id === id), `Project "${id}" not found`)
    logger.debug`set default project ID to ${id}`
    this.#defaultProjectId = id as scalar.ProjectId
  }

  get default(): ProjectData {
    if (!this.#defaultProject) {
      const id = this.defaultProjectId ?? ProjectsManager.DefaultProjectId
      let project = this.#projects.find(p => p.id === id)
      if (!project) {
        const folderUri = this.getWorkspaceFolder()
        project = {
          id,
          config: DefaultProject.config,
          folder: ProjectFolder(folderUri),
          folderUri,
          exclude: DefaultProject.exclude,
          includeConfig: DefaultProject.includeConfig,
        }
      }
      this.#defaultProject = project
    }
    return this.#defaultProject
  }

  get all(): NonEmptyReadonlyArray<scalar.ProjectId> {
    if (hasAtLeast(this.#projects, 1)) {
      const ids: NonEmptyArray<scalar.ProjectId> = [
        ...map(this.#projects, prop('id')),
        DefaultProject.id,
      ]
      // if default project is set, ensure it is first
      if (this.#defaultProjectId) {
        const idx = ids.findIndex(p => p === this.#defaultProjectId)
        if (idx > 0) {
          const [defaultProject] = ids.splice(idx, 1)
          return [defaultProject!, ...ids]
        }
      }
      return ids
    }
    return [DefaultProject.id]
  }

  getProject(arg: scalar.ProjectId | LangiumDocument): Project {
    const id = typeof arg === 'string' ? arg : (arg.likec4ProjectId || this.belongsTo(arg))
    if (id === DefaultProject.id) {
      let folderUri
      try {
        folderUri = this.services.workspace.WorkspaceManager.workspaceUri
      } catch (error) {
        logger.warn('Failed to get workspace URI, using default folder', { error })
        folderUri = URI.file('/')
        // ignore - workspace not initialized
      }
      return {
        id: ProjectsManager.DefaultProjectId,
        config: DefaultProject.config,
        folderUri,
      }
    }
    const project = this.#lookupById.get(id)
    return {
      id,
      folderUri: project.folderUri,
      config: project.config,
      ...(project.includePaths && { includePaths: map(project.includePaths, prop('uri')) }),
    }
  }

  /**
   * Validates and ensures the project ID.
   * If no project ID is specified, returns default project ID
   * If there are multiple projects and default project is not set, throws an error
   */
  ensureProjectId(projectId?: scalar.ProjectId | undefined): scalar.ProjectId {
    if (projectId === ProjectsManager.DefaultProjectId) {
      return this.defaultProjectId ?? ProjectsManager.DefaultProjectId
    }
    if (projectId) {
      invariant(this.#projectIdToFolder.has(projectId), `Project ID ${projectId} is not registered`)
      return projectId
    }
    return nonNullable(
      this.defaultProjectId,
      () => `Specify exact project, known: [${[...this.#projectIdToFolder.keys()].join(', ')}]`,
    )
  }
  /**
   * Validates and ensures the project.
   */
  ensureProject(projectId?: scalar.ProjectId | undefined): Project {
    projectId = this.ensureProjectId(projectId)
    return this.getProject(projectId)
  }

  hasMultipleProjects(): boolean {
    return this.#projects.length > 1
  }

  /**
   * Checks if the specified document should be excluded from processing.
   */
  isExcluded(document: LangiumDocument | URI | string): boolean {
    if (typeof document === 'string' || URI.isUri(document)) {
      let docUriAsString = normalizeUri(document)
      const project = this.findProjectForDocument(docUriAsString)
      if (!project.exclude) {
        return false
      }
      const input = withoutProtocol(docUriAsString)
      return project.exclude(input)
    }
    let isExcluded = this.#excludedDocuments.get(document)
    if (isExcluded === undefined) {
      isExcluded = this.isExcluded(document.uri)
      this.#excludedDocuments.set(document, isExcluded)
    }
    return isExcluded
  }

  /**
   * Checks if the specified document is included by the project:
   * - if the document belongs to the project and is not excluded
   * - if the document is included by the project
   */
  isIncluded(projectId: ProjectId, document: LangiumDocument | URI | string): boolean {
    if (typeof document !== 'string' && !URI.isUri(document)) {
      return this.isIncluded(projectId, document.uri)
    }
    const belongsTo = this.belongsTo(document)
    if (belongsTo === projectId) {
      return !this.isExcluded(document)
    }
    let includePaths = this.#lookupById.get(projectId).includePaths
    if (!includePaths) {
      return false
    }
    return includePaths.some(isParentFolderFor(document))
  }

  /**
   * Checks if it is a config file and it is not excluded by default exclude pattern
   *
   * @param entry The file system entry to check
   */
  isConfigFile(entry: URI): boolean {
    const filename = parseFilename(entry.toString(), { strict: false })?.toLowerCase()
    const isConfigFile = !!filename && isLikeC4Config(filename)
    if (isConfigFile) {
      if (DefaultProject.exclude(entry.path)) {
        logger.debug`exclude config file ${entry.path}`
        return false
      }
    }
    return isConfigFile
  }

  /**
   * Registers likec4 project by config file.
   */
  async registerConfigFile(configFile: URI, cancelToken?: Cancellation.CancellationToken): Promise<ProjectData> {
    if (DefaultProject.exclude(configFile.path)) {
      throw new Error(
        `Path to ${configFile.fsPath} is excluded by: ${DefaultProject.config.exclude.join(', ')}`,
      )
    }
    if (!this.isConfigFile(configFile)) {
      throw new Error(`${configFile.fsPath} is not a valid LikeC4 config filename.`)
    }
    try {
      const config = await this.services.workspace.FileSystemProvider.loadProjectConfig(configFile)
      const path = joinRelativeURL(configFile.path, '..')
      const folderUri = configFile.with({ path })
      return await this.registerProject({ config, folderUri }, cancelToken)
    } catch (error) {
      this.services.lsp.Connection?.window.showErrorMessage(
        `LikeC4: Failed to register project at ${configFile.fsPath}`,
      )
      throw wrapError(error, `Failed to register project config ${configFile.fsPath}:\n`)
    }
  }

  /**
   * Registers (or reloads) likec4 project by config file or config object.
   * If there is some project registered at same folder, it will be reloaded.
   */
  async registerProject(
    opts: {
      config: LikeC4ProjectConfig | LikeC4ProjectConfigInput
      folderUri: URI | string
    },
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<ProjectData> {
    const config = validateProjectConfig(opts.config)
    const folder = ProjectFolder(opts.folderUri)
    let project = this.#projects.find(p => p.folder === folder)

    if (project && deepEqual(project.config, config)) {
      return project
    }

    let mustReset = false

    let id: scalar.ProjectId

    if (!project) {
      if (this.#projectIdToFolder.has(config.name as scalar.ProjectId)) {
        logger.warn`Project "${config.name}" already exists, generating unique ID`
      }
      id = this.uniqueProjectId(config.name)
      const includeConfig = normalizeIncludeConfig(config.include)
      project = {
        id,
        config,
        folder,
        folderUri: URI.parse(folder),
        includeConfig,
      }
      // if there is any project within subfolder or parent folder
      // we need to reset assigned to documents project IDs
      mustReset = this.#projects.some(p => p.folder.startsWith(folder) || folder.startsWith(p.folder))

      this.#projects = pipe(
        [...this.#projects, project],
        sortBy(
          // sort by folder depth (longest first)
          [({ folder }) => withoutProtocol(folder).split('/').length, 'desc'],
        ),
      )
      logger.info`register project ${project.id} folder: ${folder}`
    } else {
      // Project exists but configs are different (deepEqual check above)
      mustReset = true
      if (project.config.name !== config.name) {
        this.#projectIdToFolder.delete(project.id)
        logger.info`unregister project ${project.id} folder: ${folder}`
        id = this.uniqueProjectId(config.name)
        project.id = id
        logger.info`re-register project ${project.id} folder: ${folder}`
      } else {
        id = project.id
        logger.info`update project ${project.id} on config change`
      }
      project.config = config
      const includeConfig = normalizeIncludeConfig(config.include)
      project.includeConfig = includeConfig
    }

    // Reset cached default project
    this.#defaultProject = undefined

    if (isNullish(config.exclude)) {
      project.exclude = DefaultProject.exclude
    } else if (hasAtLeast(config.exclude, 1)) {
      const patterns = map(config.exclude, p => {
        if (!isRelative(p) && !p.startsWith('**')) {
          p = joinURL('**', p)
        }
        return cleanDoubleSlashes(joinRelativeURL(project.folderUri.path, p))
      })
      project.exclude = picomatch(patterns, {
        contains: true,
        posixSlashes: true,
        posix: true,
        windows: false,
        dot: true,
      })
    }

    // Resolve include paths relative to project folder
    if (project.includeConfig.paths && hasAtLeast(project.includeConfig.paths, 1)) {
      project.includePaths = map(
        project.includeConfig.paths,
        includePath => {
          const resolvedPath = joinRelativeURL(project.folderUri.path, includePath)
          const uri = project.folderUri.with({ path: resolvedPath })
          return {
            uri,
            folder: ProjectFolder(uri),
          }
        },
      )
      logger.debug`project ${project.id} include paths: ${project.includePaths.map(p => p.uri.fsPath).join(', ')}`

      // Check for overlapping include paths with other projects
      for (const includePath of project.includePaths) {
        // Check if this include path overlaps with another project's folder
        for (const otherProject of this.#projects) {
          if (otherProject.id === project.id) continue

          if (
            includePath.folder.startsWith(otherProject.folder) || otherProject.folder.startsWith(includePath.folder)
          ) {
            mustReset = true
            logger.warn(
              'Project "{projectId}" include path "{includePath}" overlaps with project "{otherProjectId}" folder. ' +
                'Files in overlapping areas will only belong to one project.',
              { projectId: project.id, includePath: includePath.folder, otherProjectId: otherProject.id },
            )
          }

          // Check if this include path overlaps with another project's include paths
          if (otherProject.includePaths) {
            for (const otherIncludePath of otherProject.includePaths) {
              if (
                includePath.folder.startsWith(otherIncludePath.folder)
                || otherIncludePath.folder.startsWith(includePath.folder)
              ) {
                mustReset = true
                logger.warn(
                  'Project "{projectId}" include path "{includePath}" overlaps with project "{otherProjectId}" ' +
                    'include path "{otherIncludePath}". Files in overlapping areas will only belong to one project.',
                  {
                    projectId: project.id,
                    includePath: includePath.folder,
                    otherProjectId: otherProject.id,
                    otherIncludePath: otherIncludePath.folder,
                  },
                )
              }
            }
          }
        }
      }
    } else {
      delete project.includePaths
    }

    this.#projectIdToFolder.set(project.id, folder)
    this.#lookupById.clear()

    // Reset assigned project IDs if no projects reload is active
    if (mustReset && !this.#activeReload) {
      await this.rebuidProject(project.id, cancelToken).catch(error => {
        logger.warn('Failed to rebuild project {projectId} after config change', {
          projectId: project.id,
          error,
        })
      })
    }

    return project
  }

  /**
   * Determines which project the given document belongs to.
   * If the document does not belong to any project, returns the default project ID.
   */
  belongsTo(document: LangiumDocument | URI | string): scalar.ProjectId {
    if (URI.isUri(document) || typeof document === 'string') {
      const documentUri = normalizeUri(document)
      return this.findProjectForDocument(documentUri).id
    }
    return this.documentBelongsTo.get(document, () => {
      return this.findProjectForDocument(normalizeUri(document.uri))
    }).id
  }

  #activeReload: Promise<void> | null = null
  async reloadProjects(cancelToken?: Cancellation.CancellationToken): Promise<void> {
    try {
      if (!this.#activeReload) {
        logger.debug`schedule reload projects`
        this.#activeReload = this._reloadProjects(cancelToken)
      } else {
        logger.debug`reload projects is already in progress, waiting`
      }
      await this.#activeReload
    } finally {
      this.#activeReload = null
    }
  }

  protected async _reloadProjects(cancelToken?: Cancellation.CancellationToken): Promise<void> {
    const folders = this.services.workspace.WorkspaceManager.workspaceFolders
    if (!folders) {
      logger.warn('No workspace folders found')
      return
    }
    logger.debug`start reload projects`
    const configFiles = [] as URI[]
    for (const folder of folders) {
      try {
        logger.debug`scan projects in folder ${folder.uri}`
        const files = await this.services.workspace.FileSystemProvider.scanProjectFiles(URI.parse(folder.uri))
        for (const file of files) {
          if (file.isFile && this.isConfigFile(file.uri)) {
            logger.debug`found config ${file.uri.fsPath}`
            configFiles.push(file.uri)
          }
        }
      } catch (error) {
        logger.error('Failed to scanProjectFiles, {folder}', { folder: folder.uri, error })
      }
    }
    if (configFiles.length === 0 && this.#projects.length !== 0) {
      logger.warning('No config files found, but some projects were registered before')
    }

    this.#projects = []
    this.#projectIdToFolder.clear()
    this.#lookupById.clear()
    for (const uri of configFiles) {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      try {
        await this.registerConfigFile(uri, cancelToken)
      } catch (error) {
        logger.error('Failed to load config file {uri}', { uri: uri.fsPath, error })
      }
    }
    this.reset()
    await this.services.workspace.WorkspaceManager.rebuildAll(cancelToken)
  }

  protected uniqueProjectId(name: string): scalar.ProjectId {
    let id = name as scalar.ProjectId
    let i = 1
    while (this.#projectIdToFolder.has(id)) {
      id = `${name}-${i++}` as scalar.ProjectId
    }
    return id
  }

  protected reset(): void {
    logger.debug('reset')
    this.#defaultProject = undefined
    if (this.#defaultProjectId && !this.#projectIdToFolder.has(this.#defaultProjectId)) {
      this.#defaultProjectId = undefined
    }
    this.services.workspace.LangiumDocuments.resetProjectIds()
    this.documentBelongsTo.clear()
    this.mappingsToProject.clear()
    this.#lookupById.clear()
    this.#excludedDocuments = new WeakMap()
  }

  public async rebuidProject(projectId: ProjectId, cancelToken?: Cancellation.CancellationToken): Promise<void> {
    // reset default project cache
    this.#defaultProject = undefined
    const project = this.#projects.find(p => p.id === projectId) ?? this.default
    if (project.id !== projectId) {
      logger.warn`Project ${projectId} not found, rebuilding default project ${project.id}`
    }
    const log = logger.getChild(project.id)
    const folder = project.folder
    const includePaths = project.includePaths
    const docs = this.services.workspace.LangiumDocuments
      .all
      .filter(doc => {
        if (project.exclude?.(doc.uri.path)) {
          return false
        }
        const docUriStr = normalizeUri(doc.uri)
        if (docUriStr.startsWith(folder)) {
          return true
        }
        if (includePaths && includePaths.some(isParentFolderFor(docUriStr))) {
          return true
        }
        const docdir = withTrailingSlash(joinRelativeURL(docUriStr, '..'))
        return docdir.startsWith(folder) || folder.startsWith(docdir)
      })
      .map(d => d.uri)
      .toArray()
    if (docs.length > 0) {
      log.info('rebuild project documents: {docs}', {
        docs: docs.length,
      })
      this.reset()
      await this.services.workspace.DocumentBuilder
        .update(docs, [], cancelToken)
        .catch(error => {
          log.warn('Failed to rebuild project', {
            error,
          })
        })
    } else {
      log.debug('no documents in project, skipping rebuild')
    }
  }

  protected findProjectForDocument(documentUri: string): ProjectData {
    return this.mappingsToProject.get(documentUri, () => {
      const hasThisDoc = isParentFolderFor(documentUri)
      const project = this.#projects.find(hasThisDoc)
      if (project) {
        return project
      }
      const projectIncludingThisDoc = this.#projects.find(({ includePaths }) => {
        return !!includePaths && includePaths.some(hasThisDoc)
      })
      // If the document is not part of any project, assign it to the global project ID
      return projectIncludingThisDoc ?? this.default
    })
  }

  // The mapping between document URIs and their corresponding project ID
  // Lazy-created due to initialization order of the LanguageServer
  protected get mappingsToProject(): WorkspaceCache<string, ProjectData> {
    return memoizeProp(this, '_mappingsToProject', () => new WorkspaceCache(this.services))
  }

  /**
   * The mapping between documents and projects they belong to.
   * Lazy-created due to initialization order of the LanguageServer
   */
  protected get documentBelongsTo(): WorkspaceCache<LangiumDocument, ProjectData> {
    return memoizeProp(this, '_documentBelongsTo', () => new WorkspaceCache(this.services))
  }

  /**
   * Returns all include paths from all projects.
   * Used by WorkspaceManager to scan additional directories for C4 files.
   */
  getAllIncludePaths(): Array<{
    projectId: scalar.ProjectId
    includePath: URI
    includeConfig: IncludeConfig
  }> {
    const result: Array<{
      projectId: scalar.ProjectId
      includePath: URI
      includeConfig: IncludeConfig
    }> = []
    for (const project of this.#projects) {
      if (project.includePaths) {
        for (const includePath of project.includePaths) {
          result.push({
            projectId: project.id,
            includePath: includePath.uri,
            includeConfig: project.includeConfig,
          })
        }
      }
    }
    return result
  }

  private getWorkspaceFolder(): URI {
    try {
      return this.services.workspace.WorkspaceManager.workspaceUri
    } catch (error) {
      logger.warn('Failed to get workspace URI, using default folder', { error })
      return URI.file('/')
      // ignore - workspace not initialized
    }
  }
}
