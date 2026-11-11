import type { ProjectId } from '@likec4/core/types'
import { invariant } from '@likec4/core/utils'
import { type LangiumDocument, Disposable, URI } from 'langium'
import type { LikeC4SharedServices } from '../module'
import { ADisposable } from '../utils'
import type { NormalizedUri, ProjectData } from './ProjectsManager'

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

function toNormalizedUri(doc: DocOrUri): NormalizedUri {
  if (URI.isUri(doc)) {
    return doc.toString() as NormalizedUri
  }
  if (typeof doc === 'string') {
    return URI.parse(doc).toString() as NormalizedUri
  }
  return doc.uri.toString() as NormalizedUri
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
    const uri = toNormalizedUri(folder)
    const withSlash = uri.endsWith('/') ? uri : `${uri}/`
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
