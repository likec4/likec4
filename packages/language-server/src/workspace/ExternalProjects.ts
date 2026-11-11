import {
  type LikeC4ProjectConfig,
  ConfigFilenames,
  isLikeC4JsonConfig,
  LikeC4ProjectConfigOps,
} from '@likec4/config'
import type { ProjectId } from '@likec4/core/types'
import { invariant } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import { type LangiumDocument, Disposable, URI, UriUtils } from 'langium'
import picomatch from 'picomatch'
import { hasAtLeast, isNullish } from 'remeda'
import { cleanDoubleSlashes, hasProtocol, isRelative, joinRelativeURL, joinURL, withoutTrailingSlash } from 'ufo'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { ADisposable } from '../utils'
import { type NormalizedUri, type ProjectData, ProjectFolder, ProjectsManager } from './ProjectsManager'

const logger = mainLogger.getChild('external-projects')

/**
 * Prefix of internal ids of external projects.
 * Project names cannot contain ".", "@" or "#", so an external id never collides with a workspace project id.
 */
export const EXTERNAL_PROJECT_ID_PREFIX = '#'

/**
 * Internal id of an external project instance (always starts with `#`).
 * Never leaves the language server: models of consumers use the import name instead.
 */
export type ExternalProjectId = ProjectId & `#${string}`

/**
 * Checks if the given project id is an internal id of an external project.
 */
export function isExternalProjectId(id: string): id is ExternalProjectId {
  return id.startsWith(EXTERNAL_PROJECT_ID_PREFIX)
}

/**
 * Creates an internal id of an external project from the given key
 * (e.g. the original project name, optionally with a unique suffix).
 */
export function externalProjectId(key: string): ExternalProjectId {
  invariant(key.length > 0, 'External project key cannot be empty')
  invariant(!isExternalProjectId(key), `External project key must not start with "${EXTERNAL_PROJECT_ID_PREFIX}"`)
  return `${EXTERNAL_PROJECT_ID_PREFIX}${key}` as ExternalProjectId
}

/**
 * An instance of an external project (a dependency that is not a workspace project).
 * The instance is loaded into memory entirely on registration:
 * documents are read from {@link ExternalProject.files}, not from the file system.
 */
export interface ExternalProject extends ProjectData {
  /**
   * Internal id, starts with `#`
   */
  id: ExternalProjectId
  /**
   * Documents of the instance, loaded in memory: normalized document URI -> text
   */
  readonly files: ReadonlyMap<NormalizedUri, string>
}

type DocOrUri = LangiumDocument | URI | string

/**
 * Extensions of documents loaded from an external project
 */
export const EXTERNAL_PROJECT_EXTENSIONS = ['.c4', '.likec4'] as const

/**
 * Normalizes a document reference to a URI string.
 * Strings with a protocol are parsed (and re-serialized, so drive letters and escaping are normalized),
 * strings without a protocol are treated as file system paths (e.g. `C:\\deps\\model.c4`).
 */
function toNormalizedUri(doc: DocOrUri): NormalizedUri {
  if (URI.isUri(doc)) {
    return doc.toString() as NormalizedUri
  }
  if (typeof doc === 'string') {
    if (hasProtocol(doc, { acceptRelative: false, strict: true })) {
      return URI.parse(doc).toString() as NormalizedUri
    }
    return URI.file(doc).toString() as NormalizedUri
  }
  return doc.uri.toString() as NormalizedUri
}

/**
 * Normalizes a folder reference to a {@link ProjectFolder} (URI string with trailing slash).
 */
function toFolder(folder: URI | string): ProjectFolder {
  return ProjectFolder(toNormalizedUri(folder))
}

const windowsDrivePath = /^\/?([A-Za-z]):(?=\/|$)/

/**
 * Path of the URI used by exclude matchers (same as in ProjectsManager)
 */
function uriPathForMatcher(uri: URI): string {
  return uri.path.replace(windowsDrivePath, (_, drive: string) => `/${drive.toLowerCase()}:`)
}

function hasExternalProjectExtension(uri: URI): boolean {
  const path = uri.path
  return EXTERNAL_PROJECT_EXTENSIONS.some(ext => path.length > ext.length && path.endsWith(ext))
}

/**
 * Name used when the dependency has no (readable) JSON config:
 * the folder name, with characters not allowed in project names replaced by "-".
 */
function fallbackName(folderUri: URI): string {
  const name = UriUtils.basename(folderUri).replace(/[.@#]/g, '-')
  if (name === '' || name === ProjectsManager.DefaultProjectId) {
    return 'dependency'
  }
  return name
}

/**
 * Internal id of the external project loaded from the given folder.
 * Derived from the location only (never from an import name),
 * so all consumers of the same folder share one instance.
 *
 * Scheme: `#` + normalized folder URI without trailing slash,
 * e.g. `#file:///work/shared` or `#file:///c%3A/work/shared`.
 */
export function externalProjectIdOfFolder(folder: URI | string): ExternalProjectId {
  return externalProjectId(withoutTrailingSlash(toFolder(folder)))
}

/**
 * A dependency of workspace projects that resolves to a folder outside the workspace.
 */
export interface ExternalDependencyTarget {
  id: ExternalProjectId
  folder: ProjectFolder
  folderUri: URI
  /**
   * Workspace projects that declare this folder in their `dependencies`
   */
  consumers: ReadonlySet<ProjectId>
}

/**
 * Registry of external project instances.
 *
 * The registry is synchronous (reads from memory).
 * Loading of instances (network, git, file system) happens outside of it,
 * and outside of the workspace write-lock.
 */
export class ExternalProjects extends ADisposable {
  #projects = new Map<ExternalProjectId, ExternalProject>()
  #ownerOf = new Map<NormalizedUri, ExternalProjectId>()
  #listeners = [] as Array<() => void>

  constructor(protected services: LikeC4SharedServices) {
    super()
    this.onDispose(Disposable.create(() => {
      this.#listeners.length = 0
      this.#projects.clear()
      this.#ownerOf.clear()
    }))
  }

  /**
   * Checks if the external project with the given id is registered.
   */
  has(id: ProjectId | string): id is ExternalProjectId {
    return isExternalProjectId(id) && this.#projects.has(id)
  }

  /**
   * Returns the external project by id, or undefined if not registered.
   */
  get(id: ProjectId | string): ExternalProject | undefined {
    return isExternalProjectId(id) ? this.#projects.get(id) : undefined
  }

  /**
   * Returns all registered external projects.
   */
  all(): ReadonlyArray<ExternalProject> {
    return [...this.#projects.values()]
  }

  /**
   * Returns URIs of the documents of the external project (empty if not registered).
   */
  documents(id: ProjectId | string): ReadonlyArray<URI> {
    const project = this.get(id)
    if (!project) {
      return []
    }
    return [...project.files.keys()].map(uri => URI.parse(uri))
  }

  /**
   * Returns the id of the external project that owns the document, or undefined.
   */
  ownerProjectId(document: DocOrUri): ExternalProjectId | undefined {
    if (this.#ownerOf.size === 0) {
      return undefined
    }
    return this.#ownerOf.get(toNormalizedUri(document))
  }

  /**
   * Returns the external project that owns the document, or undefined.
   */
  ownerOf(document: DocOrUri): ExternalProject | undefined {
    const id = this.ownerProjectId(document)
    return id ? this.#projects.get(id) : undefined
  }

  /**
   * Returns the external project loaded from the given folder, or undefined.
   */
  findByFolder(folder: URI | string): ExternalProject | undefined {
    const withSlash = toFolder(folder)
    for (const project of this.#projects.values()) {
      if (project.folder === withSlash) {
        return project
      }
    }
    return undefined
  }

  /**
   * Synchronously reads the text of a document of an external project from memory.
   * Returns undefined if the document does not belong to any external project.
   */
  readFile(document: DocOrUri): string | undefined {
    const uri = toNormalizedUri(document)
    const id = this.#ownerOf.get(uri)
    return id ? this.#projects.get(id)?.files.get(uri) : undefined
  }

  /**
   * Registers (or replaces) an external project instance.
   * Does not create Langium documents: this is done by the caller under the workspace write-lock.
   */
  register(project: ExternalProject): void {
    invariant(isExternalProjectId(project.id), `External project id must start with "${EXTERNAL_PROJECT_ID_PREFIX}"`)
    this.removeOwnership(project.id)
    this.#projects.set(project.id, project)
    for (const uri of project.files.keys()) {
      this.#ownerOf.set(uri, project.id)
    }
    this.notifyListeners()
  }

  /**
   * Removes an external project instance.
   * Returns the removed instance, or undefined if it was not registered.
   */
  unregister(id: ProjectId | string): ExternalProject | undefined {
    const project = this.get(id)
    if (!project) {
      return undefined
    }
    this.removeOwnership(project.id)
    this.#projects.delete(project.id)
    this.notifyListeners()
    return project
  }

  /**
   * Subscribes to changes of the registry (register/unregister).
   */
  onDidChange(callback: () => void): Disposable {
    this.#listeners.push(callback)
    return Disposable.create(() => {
      const index = this.#listeners.indexOf(callback)
      if (index >= 0) {
        this.#listeners.splice(index, 1)
      }
    })
  }

  /**
   * Collects dependencies of workspace projects (from the `dependencies` section of their configs)
   * that point to folders outside the workspace.
   *
   * A dependency is inside the workspace (and not an external project) if its folder is inside
   * a workspace folder, a workspace project folder or an include path of a workspace project.
   * Consumers of the same folder share one target.
   */
  dependencyTargets(): Map<ExternalProjectId, ExternalDependencyTarget> {
    const projectsManager = this.services.workspace.ProjectsManager
    const workspaceFolders = (this.services.workspace.WorkspaceManager.workspaceFolders ?? [])
      .map(f => toFolder(f.uri))

    const consumers = projectsManager.all
      .filter(id => id !== ProjectsManager.DefaultProjectId)
      .map(id => projectsManager.getProject(id))

    const insideWorkspace = (folder: ProjectFolder) =>
      workspaceFolders.some(w => folder.startsWith(w))
      || consumers.some(p =>
        folder.startsWith(p.folder) || (p.includePaths?.some(i => folder.startsWith(i.folder)) ?? false)
      )

    const targets = new Map<ExternalProjectId, ExternalDependencyTarget & { consumers: Set<ProjectId> }>()
    for (const consumer of consumers) {
      const dependencies = consumer.config.dependencies
      if (!dependencies) {
        continue
      }
      for (const [name, path] of Object.entries(dependencies)) {
        try {
          const folderUri = UriUtils.resolvePath(consumer.folderUri, path)
          const folder = toFolder(folderUri)
          if (insideWorkspace(folder)) {
            logger.trace`dependency ${name} of ${consumer.id} is inside the workspace: ${folder}`
            continue
          }
          const id = externalProjectIdOfFolder(folder)
          let target = targets.get(id)
          if (!target) {
            target = {
              id,
              folder,
              folderUri: URI.parse(folder),
              consumers: new Set(),
            }
            targets.set(id, target)
          }
          target.consumers.add(consumer.id)
        } catch (error) {
          logger.warn(`Failed to resolve dependency {name} of project {projectId}`, {
            name,
            projectId: consumer.id,
            error,
          })
        }
      }
    }
    return targets
  }

  /**
   * Whether the set of dependency targets differs from the registered instances
   * (i.e. instances have to be added or removed).
   */
  hasStructuralChanges(
    targets: ReadonlyMap<ExternalProjectId, ExternalDependencyTarget> = this.dependencyTargets(),
  ): boolean {
    if (targets.size !== this.#projects.size) {
      return true
    }
    for (const id of targets.keys()) {
      if (!this.#projects.has(id)) {
        return true
      }
    }
    return false
  }

  /**
   * Loads all dependency targets from the file system (does not register them).
   * Targets that cannot be loaded (e.g. folder does not exist) are skipped.
   */
  async loadAll(
    targets: ReadonlyMap<ExternalProjectId, ExternalDependencyTarget> = this.dependencyTargets(),
  ): Promise<ExternalProject[]> {
    const loaded = [] as ExternalProject[]
    for (const target of targets.values()) {
      const project = await this.load(target.folderUri)
      if (project) {
        loaded.push(project)
      }
    }
    return loaded
  }

  /**
   * Loads an external project from the folder into memory (does not register it).
   *
   * - Reads `.c4` and `.likec4` documents of the folder (recursively).
   * - Reads only a JSON config (see `configJsonFilenames` of `@likec4/config`).
   *   Executable configs (`.ts`, `.js`, `.mjs`, ...) are never executed:
   *   the default config is used and a warning is logged.
   * - Without config, the default config is used (name is the folder name).
   * - `include.paths` of the dependency is ignored.
   *
   * Uses the {@link LikeC4SharedServices.workspace.FileSystemProvider}, so it works with any file system
   * (and loads nothing without one).
   * Returns undefined if the folder does not exist.
   */
  async load(folder: URI | string): Promise<ExternalProject | undefined> {
    const fs = this.services.workspace.FileSystemProvider
    const projectFolder = toFolder(folder)
    const folderUri = URI.parse(projectFolder)
    const id = externalProjectIdOfFolder(projectFolder)

    try {
      if (!(await fs.exists(folderUri))) {
        logger.warn`dependency folder does not exist: ${folderUri.fsPath}`
        return undefined
      }
    } catch (error) {
      logger.warn(`Failed to check dependency folder {folder}`, { folder: folderUri.fsPath, error })
      return undefined
    }

    const { config, configUri } = await this.loadConfig(folderUri)
    const includeConfig = {
      ...LikeC4ProjectConfigOps.normalizeInclude(config.include),
      // include.paths of a dependency is ignored
      paths: [],
    }
    const exclude = this.excludeMatcher(folderUri, config)

    const files = new Map<NormalizedUri, string>()
    try {
      const entries = await fs.readDirectory(folderUri, { recursive: true })
      for (const entry of entries) {
        if (!entry.isFile || !hasExternalProjectExtension(entry.uri) || exclude(uriPathForMatcher(entry.uri))) {
          continue
        }
        try {
          files.set(toNormalizedUri(entry.uri), await fs.readFile(entry.uri))
        } catch (error) {
          logger.warn(`Failed to read dependency document {uri}`, { uri: entry.uri.fsPath, error })
        }
      }
    } catch (error) {
      logger.warn(`Failed to read dependency folder {folder}`, { folder: folderUri.fsPath, error })
    }
    logger.debug`loaded ${id} (${config.name}) with ${files.size} documents`

    return {
      id,
      config,
      folder: projectFolder,
      folderUri,
      configUri,
      includeConfig,
      exclude,
      files,
    }
  }

  /**
   * Reads the JSON config of the dependency, or returns the default config.
   */
  protected async loadConfig(folderUri: URI): Promise<{ config: LikeC4ProjectConfig; configUri: URI }> {
    const fs = this.services.workspace.FileSystemProvider
    const defaultConfig = () => {
      const name = fallbackName(folderUri)
      try {
        return LikeC4ProjectConfigOps.validate({ name })
      } catch {
        return LikeC4ProjectConfigOps.validate({ name: 'dependency' })
      }
    }
    // JSON configs come first in ConfigFilenames
    for (const filename of ConfigFilenames) {
      const configUri = UriUtils.joinPath(folderUri, filename)
      let exists = false
      try {
        exists = await fs.exists(configUri)
      } catch {
        exists = false
      }
      if (!exists) {
        continue
      }
      if (!isLikeC4JsonConfig(filename)) {
        logger.warn(
          `Dependency {folder} has executable config {config}, it is not executed: the default config is used`,
          { folder: folderUri.fsPath, config: filename },
        )
        return { config: defaultConfig(), configUri }
      }
      try {
        const config = await fs.loadProjectConfig(configUri)
        return { config, configUri }
      } catch (error) {
        logger.warn(`Failed to load dependency config {config}, the default config is used: {error}`, {
          config: configUri.fsPath,
          error: loggable(error),
        })
        return { config: defaultConfig(), configUri }
      }
    }
    return {
      config: defaultConfig(),
      configUri: UriUtils.joinPath(folderUri, 'likec4.config.json'),
    }
  }

  /**
   * Exclude matcher of the dependency (from its config, `node_modules` by default)
   */
  protected excludeMatcher(folderUri: URI, config: LikeC4ProjectConfig): (path: string) => boolean {
    const exclude = config.exclude
    if (isNullish(exclude)) {
      return picomatch('**/node_modules/**', { dot: true })
    }
    if (!hasAtLeast(exclude, 1)) {
      return () => false
    }
    const root = uriPathForMatcher(folderUri)
    const patterns = exclude.map(p => {
      if (!isRelative(p) && !p.startsWith('**')) {
        p = joinURL('**', p)
      }
      return cleanDoubleSlashes(joinRelativeURL(root, p))
    })
    return picomatch(patterns, { contains: true, dot: true })
  }

  private removeOwnership(id: ExternalProjectId): void {
    const previous = this.#projects.get(id)
    if (!previous) {
      return
    }
    for (const uri of previous.files.keys()) {
      if (this.#ownerOf.get(uri) === id) {
        this.#ownerOf.delete(uri)
      }
    }
  }

  private notifyListeners(): void {
    for (const listener of this.#listeners.slice()) {
      listener()
    }
  }
}
