import {
  type IncludeConfig,
  type LikeC4ProjectConfig,
  type LikeC4ProjectConfigInput,
  LikeC4ProjectConfigOps,
} from '@likec4/config'
import type { NonEmptyArray, NonEmptyReadonlyArray } from '@likec4/core'
import type { ProjectId } from '@likec4/core/types'
import {
  compareNaturalHierarchically,
  DefaultMap,
  invariant,
  isString,
  nonNullable,
} from '@likec4/core/utils'
import { loggable, wrapError } from '@likec4/log'
import {
  type Cancellation,
  type LangiumDocument,
  Disposable,
  isOperationCancelled,
  URI,
  UriUtils,
} from 'langium'
import picomatch from 'picomatch'
import { find, hasAtLeast, isEmptyish, isNullish, map, pipe, prop, purry, sort } from 'remeda'
import type { Tagged } from 'type-fest'
import {
  cleanDoubleSlashes,
  hasProtocol,
  isRelative,
  joinRelativeURL,
  joinURL,
  withoutProtocol,
  withoutTrailingSlash,
  withTrailingSlash,
} from 'ufo'
import { isLikeC4Builtin } from '../likec4lib'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'

const logger = mainLogger.getChild('ProjectsManager')

export type NormalizedUri = Tagged<string, 'NormalizedUri'>

type DocOrUri = LangiumDocument | string | URI

function isLangiumDocument(doc: DocOrUri): doc is LangiumDocument {
  return typeof doc === 'object' && 'uri' in doc && 'textDocument' in doc
}

function normalizeUri(uri: DocOrUri): NormalizedUri {
  if (isLangiumDocument(uri)) {
    return uri.uri.toString() as NormalizedUri
  }
  if (typeof uri === 'string') {
    if (hasProtocol(uri)) {
      return uri as NormalizedUri
    }
    return URI.file(uri).toString() as NormalizedUri
  }
  return uri.toString() as NormalizedUri
}

/**
 * Compare function to ensure consistent order
 */
const compare = compareNaturalHierarchically('/', true)
const compareUri = (a: URI, b: URI) => compare(withoutTrailingSlash(a.path), withoutTrailingSlash(b.path))

type WithFolder = ProjectFolder | {
  folder: ProjectFolder
}

/**
 * Returns a predicate that checks if the given path is included in the project folder.
 */
function isParentFolderFor(uri: NormalizedUri) {
  return (withFolder: WithFolder) => uri.startsWith(isString(withFolder) ? withFolder : withFolder.folder)
}

function _overlaps(folderA: WithFolder, folderB: WithFolder): boolean {
  const a = isString(folderA) ? folderA : folderA.folder
  const b = isString(folderB) ? folderB : folderB.folder
  return a.startsWith(b) || b.startsWith(a)
}

function overlaps(folderA: WithFolder, folderB: WithFolder): boolean
function overlaps(folderA: WithFolder): (folderB: WithFolder) => boolean
function overlaps(...args: unknown[]) {
  return purry(_overlaps, args)
}

function _includes(project: ProjectData, docUri: NormalizedUri): boolean {
  if (docUri.startsWith(project.folder) || (project.includePaths?.some(isParentFolderFor(docUri)))) {
    return !_excludes(project, docUri)
  }
  return false
}
function _excludes(project: ProjectData, docUri: NormalizedUri): boolean {
  return project.exclude?.(withoutProtocol(docUri)) ?? false
}

/**
 * Returns true if the document is part of the project.
 */
function includes(project: ProjectData, doc: NormalizedUri): boolean
function includes(doc: NormalizedUri): (project: ProjectData) => boolean
function includes(...args: unknown[]) {
  return purry(_includes, args)
}

/**
 * Returns true if the document is excluded from the project.
 */
function excludes(project: ProjectData, doc: NormalizedUri): boolean
function excludes(doc: NormalizedUri): (project: ProjectData) => boolean
function excludes(...args: unknown[]) {
  return purry(_excludes, args)
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

export interface Project {
  id: ProjectId
  folderUri: URI
  config: LikeC4ProjectConfig
}

export interface ProjectData extends Project {
  id: ProjectId
  folder: ProjectFolder
  config: LikeC4ProjectConfig

  configUri: URI
  folderUri: URI

  exclude?: {
    (test: string): boolean
  }
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

const DefaultProject = {
  id: 'default' as ProjectId,
  config: {
    name: 'default',
    exclude: ['**/node_modules/**'],
  },
  exclude: picomatch('**/node_modules/**', { dot: true }),
  includeConfig: { paths: [], maxDepth: 3, fileThreshold: 30 } as IncludeConfig,
}

function isExcludedByDefault(uri: NormalizedUri): boolean {
  return DefaultProject.exclude(withoutProtocol(uri))
}

type RegisterProjectOptions =
  & {
    config: LikeC4ProjectConfig | LikeC4ProjectConfigInput
  }
  & (
    | { configUri: URI | string }
    | { folderUri: URI | string }
  )

/**
 * Parses the given options and returns an object with the following properties:
 * - configUri: the URI of the project configuration file
 * - folder: the project folder (with trailing slash)
 * - folderUri: the URI of the project folder
 *
 * If the options object contains a 'configUri' property, then it will be used to construct the project folder and URI.
 * Otherwise, the 'folderUri' property will be used to construct the project configuration file URI (with default file name 'likec4.config.json').
 */
function parseRegisterOptions(
  options: RegisterProjectOptions,
): {
  configUri: URI
  folder: ProjectFolder
  folderUri: URI
} {
  if ('configUri' in options) {
    invariant(!isEmptyish(options.configUri), 'configUri is emptyish')
    const configUri = URI.isUri(options.configUri) ? options.configUri : URI.parse(normalizeUri(options.configUri))
    const folder = ProjectFolder(UriUtils.dirname(configUri))
    const folderUri = URI.parse(folder)
    return { configUri, folder, folderUri }
  }
  invariant(!isEmptyish(options.folderUri), 'folderUri is emptyish')
  const folder = ProjectFolder(options.folderUri)
  const folderUri = URI.parse(folder)
  // default config file name
  const configUri = UriUtils.joinPath(folderUri, 'likec4.config.json')
  return { configUri, folder, folderUri }
}

export class ProjectsManager {
  /**
   * The global project ID used for all documents
   * that are not part of a specific project.
   */
  static readonly DefaultProjectId = DefaultProject.id

  #updateListeners = [] as Array<() => void>

  /**
   * Configured default project ID.
   * (it is used in CLI and Vite plugin)
   */
  #defaultProjectId: ProjectId | undefined = undefined
  /**
   * Cached default project.
   */
  #defaultProject: ProjectData | undefined = undefined

  // /**
  //  * The mapping between project config files and project IDs.
  //  */
  // #projectIdToFolder = new BiMap<ProjectId, ProjectFolder>()

  /**
   * Registered projects.
   * Sorted descending by the number of segments in the folder path.
   * This ensures that the most specific project is used for a document.
   */
  #projects = [] as Array<ProjectData>

  /**
   * This is a cached lookup for performance.
   */
  #projectById = new DefaultMap((id: ProjectId): ProjectData => {
    if (id === ProjectsManager.DefaultProjectId) {
      const workspaceFolder = this.getWorkspaceFolder()
      const configUri = UriUtils.joinPath(workspaceFolder, '.likec4rc')
      const folder = ProjectFolder(workspaceFolder)
      return {
        id,
        config: DefaultProject.config,
        folder,
        folderUri: URI.parse(folder),
        configUri,
        exclude: DefaultProject.exclude,
        includeConfig: DefaultProject.includeConfig,
      }
    }
    return nonNullable(this.#projects.find(p => p.id === id), `Project ${id} not found`)
  })

  #excludedDocuments = new DefaultMap((document: NormalizedUri) => {
    const docuri = normalizeUri(document)
    const owner = this.#ownerOf.get(docuri)
    if (!owner) {
      return isExcludedByDefault(docuri)
    }
    // if the document is excluded by the owner project
    if (excludes(owner, docuri)) {
      // but included by another project
      return !this.#projects.some(includes(docuri))
    }
    return false
  })

  #ownerOf = new DefaultMap((docuri: NormalizedUri) => {
    const hasThisDoc = isParentFolderFor(docuri)
    // first check if the document is part of the project
    return this.#projects.find(hasThisDoc)
      // Otherwise, check if the document is included by any project
      ?? this.#projects.find(includes(docuri))
      // if not part of any project, return null
      ?? null
  })

  constructor(protected services: LikeC4SharedServices) {
    logger.debug`created`
    // onNextTick(() => {
    //   this.services.workspace.WorkspaceManager.onForceCleanCache(() => {
    //     this.resetCaches()
    //   })
    // })
  }

  /**
   * Returns:
   *  - configured default project ID if set
   *  - the default project ID if there are no projects.
   *  - the ID of the only project
   *  - undefined if there are multiple projects.
   */
  get defaultProjectId(): ProjectId | undefined {
    if (this.#defaultProjectId) {
      return this.#defaultProjectId
    }
    if (this.#projects.length > 1) {
      return undefined
    }
    return this.#projects[0]?.id ?? ProjectsManager.DefaultProjectId
  }

  set defaultProjectId(id: string | ProjectId | undefined) {
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
    this.#defaultProjectId = id as ProjectId
  }

  get default(): ProjectData {
    if (!this.#defaultProject) {
      const id = this.defaultProjectId ?? ProjectsManager.DefaultProjectId
      this.#defaultProject = this.#projectById.get(id)
    }
    return this.#defaultProject
  }

  get all(): NonEmptyReadonlyArray<ProjectId> {
    if (hasAtLeast(this.#projects, 1)) {
      const ids: NonEmptyArray<ProjectId> = [
        ...map(this.#projects, prop('id')),
        DefaultProject.id,
      ]
      // if default project is set, ensure it is first
      if (this.#defaultProjectId) {
        const idx = ids.findIndex(p => p === this.#defaultProjectId)
        if (idx > 0) {
          ids.splice(idx, 1)
          ids.unshift(this.#defaultProjectId)
        }
      }
      return ids
    }
    return [DefaultProject.id]
  }

  getProject(arg: ProjectId | LangiumDocument): ProjectData {
    const id = typeof arg === 'string' ? arg : (arg.likec4ProjectId || this.ownerProjectId(arg))
    return this.#projectById.get(id)
  }

  /**
   * Returns all projects that overlap with the specified folder (is parent or child)
   */
  findOverlaped(folder: URI | string): ProjectData[] {
    const overlapsWith = overlaps(ProjectFolder(folder))
    const isInsideOrIncludes = (p: ProjectData) =>
      overlapsWith(p) || (!!p.includePaths && !!find(p.includePaths, overlapsWith))
    return this.#projects.filter(isInsideOrIncludes)
  }

  /**
   * Validates and ensures the project ID.
   * If no project ID is specified, returns default project ID
   * If there are multiple projects and default project is not set, throws an error
   */
  ensureProjectId(projectId?: ProjectId | undefined): ProjectId {
    if (projectId === ProjectsManager.DefaultProjectId) {
      return this.defaultProjectId ?? ProjectsManager.DefaultProjectId
    }
    if (projectId) {
      invariant(this.#projects.some(p => projectId === p.id), `Project ID ${projectId} is not registered`)
      return projectId
    }
    return nonNullable(
      this.defaultProjectId,
      () => `Specify exact project, known: [${map(this.#projects, prop('id')).join(', ')}]`,
    )
  }
  /**
   * Validates and ensures the project.
   */
  ensureProject(projectId?: ProjectId | undefined): Project {
    projectId = this.ensureProjectId(projectId)
    return this.getProject(projectId)
  }

  hasMultipleProjects(): boolean {
    return this.#projects.length > 1
  }

  /**
   * Checks if the specified document should be excluded from processing.
   */
  isExcluded(document: DocOrUri): boolean
  isExcluded(projectId: ProjectId, document: DocOrUri): boolean
  isExcluded(...args: [DocOrUri] | [ProjectId, DocOrUri]): boolean {
    const doc = args.length === 1 ? args[0] : args[1]
    // Exclude built-in documents - they are processed by the language server
    if (isLangiumDocument(doc) && isLikeC4Builtin(doc)) {
      return true
    }
    if (args.length === 1) {
      return this.#excludedDocuments.get(normalizeUri(doc))
    }
    const project = this.#projectById.get(args[0])
    return excludes(project, normalizeUri(doc))
  }

  /**
   * Checks if the specified document is included by the project:
   * - if the document belongs to the project and is not excluded
   * - if the document is included by the project
   */
  isIncluded(projectId: ProjectId, document: LangiumDocument | URI | string): boolean {
    const uri = normalizeUri(document)
    // If there are no projects, check if document is not excluded
    if (!hasAtLeast(this.#projects, 1)) {
      return !isExcludedByDefault(uri)
    }
    // If this is the default project, check if the document not belongs to any project
    if (projectId === ProjectsManager.DefaultProjectId) {
      const owner = this.#ownerOf.get(uri)
      return !owner && !isExcludedByDefault(uri)
    }
    const project = this.#projectById.get(projectId)
    return includes(project, normalizeUri(document))
  }

  /**
   * Registers likec4 project by config file.
   */
  async registerConfigFile(configUri: URI, cancelToken?: Cancellation.CancellationToken): Promise<ProjectData> {
    if (isExcludedByDefault(normalizeUri(configUri))) {
      throw new Error(
        `Failed to register project config, path ${configUri.fsPath} is excluded by: ${
          DefaultProject.config.exclude.map(p => `"${p}"`).join(', ')
        }`,
      )
    }
    try {
      const config = await this.services.workspace.FileSystemProvider.loadProjectConfig(configUri)
      return await this.registerProject({ config, configUri }, cancelToken)
    } catch (error) {
      if (!isOperationCancelled(error)) {
        throw wrapError(error, `Failed to register project config ${configUri.fsPath}:\n`)
      }
      return Promise.reject(error)
    }
  }
  /**
   * Registers (or reloads) likec4 project by config file or config object.
   * If there is some project registered at same folder, it will be reloaded.
   */
  async registerProject(
    opts: RegisterProjectOptions,
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<ProjectData> {
    const config = LikeC4ProjectConfigOps.validate(opts.config)
    const {
      configUri,
      folder,
      folderUri,
    } = parseRegisterOptions(opts)
    const includeConfig = LikeC4ProjectConfigOps.normalizeInclude(config.include)

    // find project by folder, config file can be renamed
    let project = this.#projects.find(p => p.folder === folder)
    if (!project) {
      project = {
        id: this.uniqueProjectId(config.name),
        config,
        folder,
        configUri,
        folderUri,
        includeConfig,
      }

      this.#projects = pipe(
        [...this.#projects, project],
        sort(
          (a, b) => compareUri(a.folderUri, b.folderUri),
        ),
      )
      logger.info`register project ${project.id}`
    } else {
      // if project name is changed, unregister and re-register
      if (project.config.name !== config.name) {
        // this.#projectIdToFolder.delete(project.id)
        // logger.info`unregister project ${project.id} folder: ${folder}`
        project.id = this.uniqueProjectId(config.name)
        logger.info`re-register project ${project.id}`
      }
      // update fields
      project.config = config
      project.folder = folder
      project.folderUri = folderUri
      project.configUri = configUri
      project.includeConfig = includeConfig
    }

    this.updateIncludesExcludes(project)

    // Reset cached data
    this.resetCaches()

    if (this.#activeReload) {
      // Rebuild project will notify listeners
      return project
    }

    await this.rebuildProject(project.id, cancelToken).catch(error => {
      if (isOperationCancelled(error)) {
        return Promise.reject(error)
      }
      logger.warn('Failed to rebuild project {projectId} after config change', {
        projectId: project.id,
        error,
      })
      // ignore error, we logged it
      return Promise.resolve()
    })

    this.notifyListeners()
    return project
  }

  /**
   * Determines which project the given document belongs to.
   * If the document does not belong to any project, returns the default project ID.
   */
  ownerProjectId(document: LangiumDocument | URI | string): ProjectId {
    return this.#ownerOf.get(normalizeUri(document))?.id
      // if no owner, return default project
      ?? this.#defaultProjectId
      ?? ProjectsManager.DefaultProjectId
  }

  #activeReload: Promise<void> | null = null
  async reloadProjects(cancelToken?: Cancellation.CancellationToken): Promise<void> {
    if (this.#activeReload) {
      logger.debug`reload projects is already in progress, waiting`
      return await this.#activeReload.catch(() => {
        // ignore errors
      })
    }
    logger.debug`schedule reload projects`
    this.#activeReload = Promise.resolve()
      .then(() => this._reloadProjects(cancelToken))
      .catch(error => {
        if (!isOperationCancelled(error)) {
          logger.warn('Failed to reload projects', { error })
        }
        return Promise.reject(error)
      })
      .finally(() => {
        this.#activeReload = null
        this.notifyListeners()
      })

    return await this.#activeReload
  }

  protected async _reloadProjects(cancelToken?: Cancellation.CancellationToken): Promise<void> {
    const folders = this.services.workspace.WorkspaceManager.workspaceFolders
    if (!folders || folders.length === 0) {
      logger.warn('Failed to reloadProjects, no workspace folders found')
      return
    }
    logger.debug`start reload projects`
    const configFiles = [] as URI[]
    for (const folder of folders) {
      const folderUri = URI.parse(folder.uri)
      logger.debug`scan projects in ${folderUri.fsPath}`
      try {
        const files = await this.services.workspace.FileSystemProvider.scanProjectFiles(folderUri)
        for (const file of files) {
          logger.debug`found config ${UriUtils.relative(folderUri, file.uri)}`
          configFiles.push(file.uri)
        }
      } catch (error) {
        logger.warn('Failed on scanProjectFiles in {folder}', { folder: folderUri.fsPath, error })
      }
    }
    if (configFiles.length === 0) {
      if (this.#projects.length === 0) {
        logger.warning('No config files found')
        return
      }
      logger.warning('No config files found, but {count} projects were registered before', {
        count: this.#projects.length,
      })
    }

    // Sort config files hierarchically, ensuring consistent order
    configFiles.sort(compareUri)

    // Existing projects before reload, by config file URI
    const existing = new Map(this.#projects.map(p => [p.configUri.toString(), p]))

    this.#projects = []
    this.#projectById.clear()
    for (const uri of configFiles) {
      try {
        await this.registerConfigFile(uri)
      } catch (error) {
        logger.warn(loggable(error))
        // Did we have a project before?
        const restore = existing.get(uri.toString())
        if (restore) {
          logger.debug`Update failed, restore project ${restore.id}`
          await this.registerProject(restore)
        }
      }
    }
    this.resetCaches()
    await this.services.workspace.WorkspaceManager.rebuildAll(cancelToken)
  }

  protected uniqueProjectId(name: string): ProjectId {
    const currentIds = new Set(map(this.#projects, prop('id')))
    let id = name as ProjectId
    if (!currentIds.has(id)) {
      return id
    }
    logger.warn`Project "${name}" already exists, generating unique ID`
    let i = 1
    while (currentIds.has(id)) {
      id = `${name}-${i++}` as ProjectId
    }
    return id
  }

  protected resetCaches(): void {
    logger.trace('resetCaches')
    this.#defaultProject = undefined
    if (this.#defaultProjectId && !this.#projects.some(p => p.id === this.#defaultProjectId)) {
      this.#defaultProjectId = undefined
    }
    this.#projectById.clear()
    this.#ownerOf.clear()
    this.#excludedDocuments.clear()
  }

  public async rebuildProject(projectId: ProjectId, cancelToken?: Cancellation.CancellationToken): Promise<void> {
    const project = this.#projects.find(p => p.id === projectId)
    if (!project) {
      if (projectId !== ProjectsManager.DefaultProjectId) {
        logger.warn`Project ${projectId} not found, rebuilding all`
      } else {
        logger.info`Rebuilding all documents `
      }
      return await this.services.workspace.WorkspaceManager.rebuildAll(cancelToken)
    }

    const log = logger.getChild(project.id)
    const _includes = (doc: DocOrUri) => includes(project, normalizeUri(doc))

    const docs = this.services.workspace.LangiumDocuments
      .resetProjectIds()
      .filter(_includes)
    // If no documents are found, return early
    if (docs.length === 0) {
      return
    }

    log.info('rebuild project documents: {docs}', {
      docs: docs.length,
    })
    this.resetCaches()
    await this.services.workspace.DocumentBuilder
      .update(docs, [], cancelToken)
      .catch(error => {
        log.warn('Failed to rebuild project', {
          error,
        })
      })
  }

  /**
   * Returns all include paths from all projects.
   * Used by WorkspaceManager to scan additional directories for C4 files.
   */
  public getAllIncludePaths(): Array<{
    projectId: ProjectId
    includePath: URI
    includeConfig: IncludeConfig
  }> {
    const result: Array<{
      projectId: ProjectId
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

  /**
   * Register a listener to be called when the projects configuration has changed.
   * @returns A disposable that can be used to unregister the callback.
   */
  public onProjectsUpdate(callback: () => void): Disposable {
    this.#updateListeners.push(callback)
    return Disposable.create(() => {
      const index = this.#updateListeners.indexOf(callback)
      if (index >= 0) {
        this.#updateListeners.splice(index, 1)
      }
    })
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

  private notifyListeners() {
    for (const listener of this.#updateListeners) {
      try {
        listener()
      } catch (e) {
        logger.warn(loggable(e))
      }
    }
  }

  private updateIncludesExcludes(project: ProjectData): ProjectData {
    const config = project.config
    switch (true) {
      case isNullish(config.exclude):
        project.exclude = DefaultProject.exclude
        break
      case config.exclude && hasAtLeast(config.exclude, 1): {
        const patterns = map(config.exclude, p => {
          if (!isRelative(p) && !p.startsWith('**')) {
            p = joinURL('**', p)
          }
          return cleanDoubleSlashes(joinRelativeURL(project.folderUri.path, p))
        })
        project.exclude = picomatch(patterns, {
          contains: true,
          dot: true,
        })
        break
      }
      default:
        delete project.exclude
    }

    const paths = project.includeConfig.paths
    if (!hasAtLeast(paths, 1)) {
      delete project.includePaths
      return project
    }

    // Resolve include paths relative to project folder
    project.includePaths = map(
      paths,
      includePath => {
        const uri = UriUtils.resolvePath(project.folderUri, includePath)
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

        if (overlaps(includePath, otherProject)) {
          logger.warn(
            'Project "{projectId}" include path "{includePath}" overlaps with project "{otherProjectId}" folder. ' +
              'Files in overlapping areas will only belong to one project.',
            { projectId: project.id, includePath: includePath.folder, otherProjectId: otherProject.id },
          )
        }

        // Check if this include path overlaps with another project's include paths
        otherProject.includePaths?.forEach((otherIncludePath) => {
          if (overlaps(includePath, otherIncludePath)) {
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
        })
      }
    }
    return project
  }
}
