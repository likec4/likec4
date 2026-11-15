import {
  type GitDependencySource,
  type LikeC4ProjectConfig,
  ConfigFilenames,
  isGitDependencySource,
  isLikeC4JsonConfig,
  LikeC4ProjectConfigOps,
  parseGitRepositoryUrl,
} from '@likec4/config'
import type { ProjectId } from '@likec4/core/types'
import { invariant, objectHash } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import { deepEqual } from 'fast-equals'
import { type LangiumDocument, Disposable, URI, UriUtils } from 'langium'
import picomatch from 'picomatch'
import { hasAtLeast, isNullish, omit } from 'remeda'
import { cleanDoubleSlashes, hasProtocol, isRelative, joinRelativeURL, joinURL, withoutTrailingSlash } from 'ufo'
import type { DependencyCacheEntry, DependencyState, DependencyVersionRecord } from '../dependencies/types'
import { logger as mainLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { ADisposable } from '../utils'
import {
  type GitDependencyInstance,
  DEPENDENCY_URI_SCHEME,
  gitDependencyUri,
  isValidLocalDependencyFolder,
  localDependencyFolder,
  localDependencyUri,
  normalizeGitSubdir,
  parseDependencyUri,
} from './dependency-uri'
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
 *
 * Documents have URIs with the `likec4-dep` scheme (see `dependency-uri.ts`),
 * the instance they belong to is derived from the URI.
 */
export interface ExternalProject extends ProjectData {
  /**
   * Internal id, starts with `#`
   */
  id: ExternalProjectId
  /**
   * Documents of the instance, loaded in memory: `likec4-dep` document URI -> text
   */
  readonly files: ReadonlyMap<NormalizedUri, string>
  /**
   * Instance of a git dependency (repository, SHA, subdirectory), undefined for a local dependency
   */
  readonly git?: GitDependencyInstance | undefined
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
 * Internal id of the external project a `likec4-dep` document belongs to, derived from the URI alone:
 * - local dependency: {@link externalProjectIdOfFolder} of the instance folder (same as on registration)
 * - other dependencies (git, planned): `#likec4-dep://<authority>/<instance>`
 *
 * Returns undefined for other URIs, or a malformed `likec4-dep` URI.
 */
export function externalProjectIdOfUri(uri: URI | string): ExternalProjectId | undefined {
  const parsed = parseDependencyUri(uri)
  if (!parsed) {
    return undefined
  }
  const folder = localDependencyFolder(parsed)
  if (folder) {
    return externalProjectIdOfFolder(folder)
  }
  return externalProjectId(`${DEPENDENCY_URI_SCHEME}://${parsed.authority}${parsed.instance}`)
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
 * Internal id of the instance of a git dependency (the triple "repository, SHA, subdirectory"),
 * the same as derived from the URIs of its documents (see {@link externalProjectIdOfUri}):
 * `#likec4-dep://<host>/<repository path>@<sha>[/<subdir>]`.
 * All consumers of the same instance share it.
 */
export function externalProjectIdOfGitInstance(instance: GitDependencyInstance): ExternalProjectId {
  const id = externalProjectIdOfUri(gitDependencyUri(instance, 'likec4.config.json'))
  invariant(id, `Invalid git dependency instance: ${instance.repository}@${instance.sha}`)
  return id
}

/**
 * A git dependency declared in the `dependencies` section of a workspace project (the pair "consumer, name").
 */
export interface GitDependencyTarget {
  /**
   * Workspace project that declares the dependency
   */
  consumer: ProjectId
  /**
   * Import name (key of the `dependencies` section)
   */
  name: string
  source: GitDependencySource
  /**
   * Identity of the repository (`host[:port]/path`)
   */
  repository: string
  /**
   * Normalized subdirectory (see `normalizeGitSubdir`), `''` for the repository root
   */
  subdir: string
}

/**
 * Key of a git dependency target: changes when the consumer, the name or the source (repository, ref, subdirectory) changes
 */
function gitTargetKey(target: GitDependencyTarget): string {
  return JSON.stringify([target.consumer, target.name, target.repository, target.source.ref, target.subdir])
}

/**
 * Result of resolving a git dependency target against the dependency storage:
 * - `installed` - the version index has a SHA for the ref, and the instance is in the storage
 * - `not-installed` - no SHA for the ref, or the instance is not in the storage
 * - `unsupported` - not installed, and the host cannot install dependencies (e.g. browser)
 */
export type GitDependencyResolution =
  | {
    status: 'installed'
    target: GitDependencyTarget
    instance: GitDependencyInstance
    projectId: ExternalProjectId
  }
  | {
    status: 'not-installed' | 'unsupported'
    target: GitDependencyTarget
  }

/**
 * Git dependencies loaded from the dependency storage, see {@link ExternalProjects.loadGit}
 */
export interface LoadedGitDependencies {
  /**
   * Installed instances (one per instance, shared by all consumers)
   */
  projects: ExternalProject[]
  /**
   * Resolution of each target, except {@link failed} ones
   */
  resolutions: GitDependencyResolution[]
  /**
   * Targets the storage could not be read for, with no previous resolution of the same source to keep.
   * They get no resolution (and no state: no "install" advice for a dependency that may be installed),
   * must not be marked as synced, and are retried by the next sync.
   */
  failed: GitDependencyTarget[]
}

/**
 * Instance the import resolves to (undefined if not installed)
 */
function resolvedInstance(resolution: GitDependencyResolution | undefined): ExternalProjectId | undefined {
  return resolution?.status === 'installed' ? resolution.projectId : undefined
}

function groupResolutions(
  resolutions: ReadonlyArray<GitDependencyResolution>,
): Map<ProjectId, Map<string, GitDependencyResolution>> {
  const grouped = new Map<ProjectId, Map<string, GitDependencyResolution>>()
  for (const resolution of resolutions) {
    const { consumer, name } = resolution.target
    let byName = grouped.get(consumer)
    if (!byName) {
      byName = new Map()
      grouped.set(consumer, byName)
    }
    byName.set(name, resolution)
  }
  return grouped
}

/**
 * Name used when a git dependency has no (readable) JSON config:
 * the last segment of the subdirectory or of the repository path.
 */
function gitFallbackName(instance: GitDependencyInstance): string {
  const segments = [...instance.repository.split('/'), ...instance.subdir.split('/')].filter(s => s.length > 0)
  const name = (segments.at(-1) ?? '').replace(/\.git$/, '').replace(/[.@#]/g, '-')
  if (name === '' || name === ProjectsManager.DefaultProjectId) {
    return 'dependency'
  }
  return name
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
  #listeners = [] as Array<() => void>

  constructor(protected services: LikeC4SharedServices) {
    super()
    this.onDispose(Disposable.create(() => {
      this.#listeners.length = 0
      this.#projects.clear()
      this.#syncedTargets.clear()
      this.#syncedGitTargets.clear()
      this.#gitResolutions.clear()
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
   * Returns the id of the external project the document belongs to, derived from its `likec4-dep` URI
   * (see {@link externalProjectIdOfUri}): the same id while the instance is registered and after it is removed.
   * Returns undefined for other documents.
   */
  ownerProjectId(document: DocOrUri): ExternalProjectId | undefined {
    return externalProjectIdOfUri(typeof document === 'string' || URI.isUri(document) ? document : document.uri)
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
    return this.ownerOf(document)?.files.get(toNormalizedUri(document))
  }

  /**
   * Registers (or replaces) an external project instance.
   *
   * The id of the instance must be the id derived from the URIs of its documents
   * (for a local dependency: {@link externalProjectIdOfFolder}), otherwise its documents are not owned by it.
   * Does not create Langium documents: this is done by the caller under the workspace write-lock.
   */
  register(project: ExternalProject): void {
    invariant(isExternalProjectId(project.id), `External project id must start with "${EXTERNAL_PROJECT_ID_PREFIX}"`)
    for (const uri of project.files.keys()) {
      const owner = externalProjectIdOfUri(uri)
      invariant(
        owner === undefined || owner === project.id,
        `Document ${uri} belongs to ${owner}, not to the external project ${project.id}`,
      )
    }
    this.#projects.set(project.id, project)
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

    const workspaceRoots = [
      ...workspaceFolders,
      ...consumers.flatMap(p => [p.folder, ...(p.includePaths?.map(i => i.folder) ?? [])]),
    ]
    // Folder is inside a workspace folder, a workspace project folder or an include path
    const insideWorkspace = (folder: ProjectFolder) => workspaceRoots.some(root => folder.startsWith(root))
    // Folder contains a workspace folder, a workspace project folder or an include path
    // (documents of the workspace would be owned by the external project)
    const containsWorkspace = (folder: ProjectFolder) => workspaceRoots.some(root => root.startsWith(folder))

    const targets = new Map<ExternalProjectId, ExternalDependencyTarget & { consumers: Set<ProjectId> }>()
    for (const consumer of consumers) {
      const dependencies = consumer.config.dependencies
      if (!dependencies) {
        continue
      }
      for (const [name, path] of Object.entries(dependencies)) {
        // Git sources are not local folders, see gitDependencyTargets
        if (isGitDependencySource(path)) {
          continue
        }
        try {
          const folderUri = UriUtils.resolvePath(consumer.folderUri, path)
          const folder = toFolder(folderUri)
          if (insideWorkspace(folder)) {
            logger.trace`dependency ${name} of ${consumer.id} is inside the workspace: ${folder}`
            continue
          }
          if (containsWorkspace(folder)) {
            logger.warn(
              'Dependency {name} of project {projectId} is skipped: folder {folder} contains the workspace or its projects',
              { name, projectId: consumer.id, folder: folderUri.fsPath },
            )
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
   * Collects git dependencies of workspace projects (from the `dependencies` section of their configs).
   * Synchronous: reads only configs. The SHA of each target is read from the storage by {@link loadGit}.
   *
   * Sources that cannot be parsed (invalid URL or subdirectory) are skipped (the config schema rejects them).
   */
  gitDependencyTargets(): GitDependencyTarget[] {
    const projectsManager = this.services.workspace.ProjectsManager
    const targets = [] as GitDependencyTarget[]
    for (const id of projectsManager.all) {
      if (id === ProjectsManager.DefaultProjectId) {
        continue
      }
      const dependencies = projectsManager.getProject(id).config.dependencies
      if (!dependencies) {
        continue
      }
      for (const [name, source] of Object.entries(dependencies)) {
        if (!isGitDependencySource(source)) {
          continue
        }
        try {
          const repository = parseGitRepositoryUrl(source.git)?.id
          if (!repository) {
            logger.warn`git dependency ${name} of ${id} is skipped: invalid URL ${source.git}`
            continue
          }
          targets.push({ consumer: id, name, source, repository, subdir: normalizeGitSubdir(source.path) })
        } catch (error) {
          logger.warn(`Git dependency {name} of project {projectId} is skipped`, { name, projectId: id, error })
        }
      }
    }
    return targets
  }

  /**
   * Whether the git dependency targets are the same (same consumers, names and sources).
   */
  static sameGitTargets(a: ReadonlyArray<GitDependencyTarget>, b: ReadonlyArray<GitDependencyTarget>): boolean {
    if (a.length !== b.length) {
      return false
    }
    const keys = new Set(a.map(gitTargetKey))
    return b.every(t => keys.has(gitTargetKey(t)))
  }

  /**
   * Resolution of git dependencies of the last applied sync: consumer -> name -> resolution
   */
  #gitResolutions = new Map<ProjectId, Map<string, GitDependencyResolution>>()

  /**
   * Resolution of the git dependency `name` of the consumer (as of the last applied sync),
   * undefined if the name is not a git dependency of the consumer, or dependencies were not synced yet.
   */
  gitResolution(consumer: ProjectId, name: string): GitDependencyResolution | undefined {
    return this.#gitResolutions.get(consumer)?.get(name)
  }

  /**
   * Resolutions of all git dependencies (as of the last applied sync).
   */
  gitResolutions(): GitDependencyResolution[] {
    return [...this.#gitResolutions.values()].flatMap(byName => [...byName.values()])
  }

  /**
   * Consumers whose imports of git dependencies resolve differently with the given resolutions
   * (a dependency becomes installed or not installed, or resolves to another instance),
   * i.e. consumers to relink.
   */
  changedGitConsumers(resolutions: ReadonlyArray<GitDependencyResolution>): Set<ProjectId> {
    const changed = new Set<ProjectId>()
    const next = groupResolutions(resolutions)
    for (const consumer of new Set([...next.keys(), ...this.#gitResolutions.keys()])) {
      const previous = this.#gitResolutions.get(consumer) ?? new Map<string, GitDependencyResolution>()
      const current = next.get(consumer) ?? new Map<string, GitDependencyResolution>()
      for (const name of new Set([...previous.keys(), ...current.keys()])) {
        if (resolvedInstance(previous.get(name)) !== resolvedInstance(current.get(name))) {
          changed.add(consumer)
          break
        }
      }
    }
    return changed
  }

  /**
   * Replaces the resolutions of git dependencies (called together with registering their instances).
   *
   * @returns consumers whose resolutions changed (see {@link changedGitConsumers})
   */
  setGitResolutions(resolutions: ReadonlyArray<GitDependencyResolution>): Set<ProjectId> {
    const changed = this.changedGitConsumers(resolutions)
    this.#gitResolutions = groupResolutions(resolutions)
    return changed
  }

  /**
   * States of git dependencies of consumers, computed from the resolutions of the last applied sync
   * and the registered instances (synchronous, from memory).
   * `filesWithErrors` counts documents of the instance with lexer or parser errors.
   */
  dependencyStates(): DependencyState[] {
    const langiumDocuments = this.services.workspace.LangiumDocuments
    const notInstalled = this.notInstalledStatus()
    const errorsByProject = new Map<ExternalProjectId, number>()
    const filesWithErrors = (project: ExternalProject): number => {
      let count = errorsByProject.get(project.id)
      if (count === undefined) {
        count = 0
        for (const uri of project.files.keys()) {
          const doc = langiumDocuments.getDocument(URI.parse(uri))
          if (doc && (doc.parseResult.lexerErrors.length > 0 || doc.parseResult.parserErrors.length > 0)) {
            count++
          }
        }
        errorsByProject.set(project.id, count)
      }
      return count
    }
    return this.gitResolutions().map((resolution): DependencyState => {
      const { consumer, name, source } = resolution.target
      const project = resolution.status === 'installed' ? this.#projects.get(resolution.projectId) : undefined
      if (resolution.status === 'installed' && project) {
        return {
          status: 'installed',
          consumer,
          name,
          source,
          instance: resolution.instance,
          projectId: resolution.projectId,
          filesWithErrors: filesWithErrors(project),
        }
      }
      return {
        // Installed, but the instance is not registered (should not happen): as not installed
        status: resolution.status === 'installed' ? notInstalled : resolution.status,
        consumer,
        name,
        source,
      }
    })
  }

  /**
   * Ids of the dependency targets of the last sync (including targets that could not be loaded)
   */
  #syncedTargets = new Set<ExternalProjectId>()

  /**
   * Keys of the git dependency targets of the last sync (including targets that are not installed)
   */
  #syncedGitTargets = new Set<string>()

  /**
   * Remembers the dependency targets of a sync (including targets that could not be loaded, e.g. missing folders),
   * so {@link hasStructuralChanges} does not report them again until the dependencies change.
   */
  markSynced(targets: Iterable<ExternalProjectId>): void {
    this.#syncedTargets = new Set(targets)
  }

  /**
   * Remembers the git dependency targets of a sync (including targets that are not installed),
   * so {@link hasStructuralChanges} does not report them again until the dependencies change.
   * Targets in `except` (the storage could not be read for them) stay unsynced: the next sync retries them.
   */
  markGitSynced(targets: Iterable<GitDependencyTarget>, except: Iterable<GitDependencyTarget> = []): void {
    const failed = new Set([...except].map(gitTargetKey))
    this.#syncedGitTargets = new Set([...targets].map(gitTargetKey).filter(key => !failed.has(key)))
  }

  /**
   * Whether the set of dependency targets differs from the targets of the last sync
   * (i.e. instances have to be added or removed, or git dependencies changed).
   */
  hasStructuralChanges(
    targets: ReadonlyMap<ExternalProjectId, ExternalDependencyTarget> = this.dependencyTargets(),
    gitTargets: ReadonlyArray<GitDependencyTarget> = this.gitDependencyTargets(),
  ): boolean {
    if (targets.size !== this.#syncedTargets.size || gitTargets.length !== this.#syncedGitTargets.size) {
      return true
    }
    for (const id of targets.keys()) {
      if (!this.#syncedTargets.has(id)) {
        return true
      }
    }
    for (const target of gitTargets) {
      if (!this.#syncedGitTargets.has(gitTargetKey(target))) {
        return true
      }
    }
    return false
  }

  /**
   * Loads git dependencies from the dependency storage into memory (does not register them):
   * reads the SHA of each target from the version index, then the installed instances.
   *
   * Never goes to the network: a target without a SHA, or without an instance in the storage, is not installed.
   * One instance (repository, SHA, subdirectory) is loaded once and shared by all its consumers.
   * Must be called outside of the workspace write-lock (the storage is asynchronous).
   */
  async loadGit(
    targets: ReadonlyArray<GitDependencyTarget> = this.gitDependencyTargets(),
  ): Promise<LoadedGitDependencies> {
    if (targets.length === 0) {
      return { projects: [], resolutions: [], failed: [] }
    }
    const storage = this.services.dependencies.Storage
    const notInstalled = this.notInstalledStatus()

    // Version index: one read per (repository, ref), in parallel.
    // `failed` - the storage could not be read (not the same as "no version")
    type VersionRead = DependencyVersionRecord | undefined | 'failed'
    const versions = new Map<string, Promise<VersionRead>>()
    const readVersion = (target: GitDependencyTarget): Promise<VersionRead> => {
      const key = JSON.stringify([target.repository, target.source.ref])
      let version = versions.get(key)
      if (!version) {
        version = storage.readVersion(target.repository, target.source.ref).catch((error): VersionRead => {
          logger.warn(`Failed to read the version of {repository}@{ref}, the previous state is kept`, {
            repository: target.repository,
            ref: target.source.ref,
            error,
          })
          return 'failed'
        })
        versions.set(key, version)
      }
      return version
    }
    const versionReads = await Promise.all(targets.map(readVersion))

    const instances = new Map<ExternalProjectId, GitDependencyInstance>()
    const resolved = targets.map((target, index) => {
      const version = versionReads[index]
      if (version === 'failed') {
        return { target, projectId: 'failed' as const }
      }
      if (!version) {
        return { target, projectId: undefined }
      }
      const instance: GitDependencyInstance = {
        repository: target.repository,
        sha: version.sha,
        subdir: target.subdir,
      }
      const projectId = externalProjectIdOfGitInstance(instance)
      instances.set(projectId, instance)
      return { target, projectId }
    })

    // Installed instances, with one batch request
    const toRead = [...instances.entries()]
    let entries: Array<DependencyCacheEntry | undefined> | 'failed' = []
    if (toRead.length > 0) {
      try {
        entries = await storage.readEntries(toRead.map(([, instance]) => instance))
      } catch (error) {
        logger.warn('Failed to read git dependencies from the dependency storage, the previous state is kept', {
          error,
        })
        entries = 'failed'
      }
    }
    const projects = new Map<ExternalProjectId, ExternalProject>()
    if (entries !== 'failed') {
      for (const [index, [id, instance]] of toRead.entries()) {
        const entry = entries[index]
        if (entry) {
          projects.set(id, this.gitProject(instance, entry))
        }
      }
    }

    const resolutions = [] as GitDependencyResolution[]
    const failed = [] as GitDependencyTarget[]
    for (const { target, projectId } of resolved) {
      if (projectId === 'failed' || (projectId && entries === 'failed')) {
        // The storage could not be read: keep the previous resolution (and its instance) of the same source
        const previous = this.gitResolution(target.consumer, target.name)
        if (previous && gitTargetKey(previous.target) === gitTargetKey(target)) {
          const registered = previous.status === 'installed' ? this.#projects.get(previous.projectId) : undefined
          if (registered) {
            projects.set(registered.id, registered)
            resolutions.push({ ...previous, target })
            continue
          }
          if (previous.status !== 'installed') {
            resolutions.push({ ...previous, target })
            continue
          }
        }
        // Nothing to keep: unknown until a successful read
        failed.push(target)
        continue
      }
      const project = projectId ? projects.get(projectId) : undefined
      if (project?.git) {
        resolutions.push({ status: 'installed', target, instance: project.git, projectId: project.id })
      } else {
        resolutions.push({ status: notInstalled, target })
      }
    }
    if (projects.size > 0) {
      logger.debug`loaded ${projects.size} git dependency instances`
    }
    return { projects: [...projects.values()], resolutions, failed }
  }

  /**
   * Status of a git dependency that is not installed:
   * `unsupported` if the host cannot install dependencies (e.g. browser), `not-installed` otherwise
   */
  protected notInstalledStatus(): 'not-installed' | 'unsupported' {
    return this.services.dependencies.Installer.supported ? 'not-installed' : 'unsupported'
  }

  /**
   * Resolution of the git dependency `name` of the consumer, if it was resolved for the given source
   * (repository, ref and subdirectory). Undefined if the config changed after the last sync
   * (until the next sync resolves the new source).
   */
  gitResolutionFor(
    consumer: ProjectId,
    name: string,
    source: GitDependencySource,
  ): GitDependencyResolution | undefined {
    const resolution = this.gitResolution(consumer, name)
    if (!resolution) {
      return undefined
    }
    try {
      const target = resolution.target
      return parseGitRepositoryUrl(source.git)?.id === target.repository
          && source.ref === target.source.ref
          && normalizeGitSubdir(source.path) === target.subdir
        ? resolution
        : undefined
    } catch {
      return undefined
    }
  }

  /**
   * Creates an external project from an installed instance of a git dependency.
   *
   * - Documents are the `.c4` and `.likec4` files of the entry, under `likec4-dep` URIs of the instance.
   * - Only a JSON config of the entry is read (executable configs are never in the storage).
   *   Without config, the default config is used (name is the last segment of the subdirectory or repository).
   * - `include.paths` of the dependency is ignored.
   */
  protected gitProject(instance: GitDependencyInstance, entry: DependencyCacheEntry): ExternalProject {
    const id = externalProjectIdOfGitInstance(instance)
    const files = new Map<NormalizedUri, string>()
    let configFile: { filename: string; text: string } | undefined
    for (const filename of ConfigFilenames) {
      const text = entry.files[filename]
      if (isLikeC4JsonConfig(filename) && typeof text === 'string') {
        configFile = { filename, text }
        break
      }
    }
    for (const [path, text] of Object.entries(entry.files)) {
      if (!EXTERNAL_PROJECT_EXTENSIONS.some(ext => path.length > ext.length && path.endsWith(ext))) {
        continue
      }
      try {
        files.set(gitDependencyUri(instance, path).toString() as NormalizedUri, text)
      } catch (error) {
        logger.warn(`Invalid path {path} in git dependency {id}`, { path, id, error })
      }
    }

    const defaultConfig = () => {
      try {
        return LikeC4ProjectConfigOps.validate({ name: gitFallbackName(instance) })
      } catch {
        return LikeC4ProjectConfigOps.validate({ name: 'dependency' })
      }
    }
    let config: LikeC4ProjectConfig
    if (configFile) {
      try {
        config = LikeC4ProjectConfigOps.parse(configFile.text)
      } catch (error) {
        logger.warn(`Failed to load the config of git dependency {id}, the default config is used: {error}`, {
          id,
          error: loggable(error),
        })
        config = defaultConfig()
      }
    } else {
      config = defaultConfig()
    }
    const configUri = gitDependencyUri(instance, configFile?.filename ?? 'likec4.config.json')
    // Parent of all documents of the instance: `likec4-dep://<host>/<repo>@<sha>[/<subdir>]/-/`
    const folder = ProjectFolder(UriUtils.dirname(configUri))
    const includeConfig = {
      ...LikeC4ProjectConfigOps.normalizeInclude(config.include),
      // include.paths of a dependency is ignored
      paths: [],
    }
    logger.debug`loaded ${id} (${config.name}) with ${files.size} documents`
    return {
      id,
      config,
      folder,
      folderUri: URI.parse(folder),
      configUri,
      includeConfig,
      // Files of the entry are selected by the installer
      exclude: () => false,
      files,
      git: instance,
      // Same formula as hashes of workspace projects (ProjectsManager)
      hash: objectHash([
        id + folder + configUri.toString(),
        omit(config, ['generators', 'include']),
        includeConfig,
      ]),
    }
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

    if (!isValidLocalDependencyFolder(folderUri)) {
      logger.warn`dependency folder is not supported (local folder expected): ${folderUri}`
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
          const uri = localDependencyUri(folderUri, entry.uri).toString() as NormalizedUri
          files.set(uri, await fs.readFile(entry.uri))
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
      // Same formula as hashes of workspace projects (ProjectsManager)
      hash: objectHash([
        id + projectFolder + configUri.toString(),
        omit(config, ['generators', 'include']),
        includeConfig,
      ]),
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

  /**
   * Whether the loaded instances differ from the registered ones
   * (instances added or removed, documents or config changed).
   */
  differsFromRegistered(loaded: ReadonlyArray<ExternalProject>): boolean {
    if (loaded.length !== this.#projects.size) {
      return true
    }
    for (const project of loaded) {
      const registered = this.#projects.get(project.id)
      if (
        !registered
        || registered.folder !== project.folder
        || !deepEqual(registered.config, project.config)
        || registered.files.size !== project.files.size
      ) {
        return true
      }
      for (const [uri, text] of project.files) {
        if (registered.files.get(uri) !== text) {
          return true
        }
      }
    }
    return false
  }

  private notifyListeners(): void {
    for (const listener of this.#listeners.slice()) {
      listener()
    }
  }
}
