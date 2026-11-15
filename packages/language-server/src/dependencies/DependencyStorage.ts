import { isPlainObject } from 'remeda'
import type { Storage } from 'unstorage'
import type { LikeC4SharedServices } from '../module'
import type { GitDependencyInstance } from '../workspace/dependency-uri'
import {
  hasDependencyCacheEntry,
  readDependencyCacheEntries,
  readDependencyCacheEntry,
  writeDependencyCacheEntry,
} from './storage'
import type { DependencyCacheEntry, DependencyVersionRecord } from './types'
import { readDependencyVersion, writeDependencyVersion } from './version-index'

/**
 * Name of the flag in `initializationOptions` by which the client declares its dependency storage:
 * `{ dependencyStorage: true }` - the client answers the `likec4/dependency-storage/*` requests
 * (see `DependencyStorageRequests` in `protocol.ts`).
 */
export const CLIENT_DEPENDENCY_STORAGE_OPTION = 'dependencyStorage'

/**
 * Whether the client declared its dependency storage in `initializationOptions`.
 */
export function clientDeclaresDependencyStorage(initializationOptions: unknown): boolean {
  return isPlainObject(initializationOptions) && initializationOptions[CLIENT_DEPENDENCY_STORAGE_OPTION] === true
}

/**
 * Storage of git dependencies: installed instances and the version index (see `storage.ts` and `version-index.ts`).
 *
 * The backing storage is an unstorage {@link Storage} provided by the host
 * (`dependencyStorage` of the module context, in-memory by default)
 * and can be replaced at runtime with {@link use} (e.g. with the client storage after `initialize`).
 *
 * Access is asynchronous: it is used outside of the workspace write-lock.
 */
export class DependencyStorage {
  #storage: Storage

  constructor(_services: LikeC4SharedServices, storage: Storage) {
    this.#storage = storage
  }

  /**
   * The backing storage
   */
  get storage(): Storage {
    return this.#storage
  }

  /**
   * Replaces the backing storage. The previous one is not disposed.
   */
  use(storage: Storage): void {
    this.#storage = storage
  }

  /**
   * Reads the installed instance, undefined if not installed.
   */
  readEntry(instance: GitDependencyInstance): Promise<DependencyCacheEntry | undefined> {
    return readDependencyCacheEntry(this.#storage, instance)
  }

  /**
   * Reads several installed instances with one batch request (undefined for instances that are not installed).
   */
  readEntries(instances: ReadonlyArray<GitDependencyInstance>): Promise<Array<DependencyCacheEntry | undefined>> {
    return readDependencyCacheEntries(this.#storage, instances)
  }

  /**
   * Checks if the instance is installed.
   */
  hasEntry(instance: GitDependencyInstance): Promise<boolean> {
    return hasDependencyCacheEntry(this.#storage, instance)
  }

  /**
   * Writes the record of an installed instance.
   */
  writeEntry(entry: DependencyCacheEntry): Promise<void> {
    return writeDependencyCacheEntry(this.#storage, entry)
  }

  /**
   * Reads the SHA the ref of the repository resolved to, undefined if not resolved yet.
   */
  readVersion(repository: string, ref: string): Promise<DependencyVersionRecord | undefined> {
    return readDependencyVersion(this.#storage, repository, ref)
  }

  /**
   * Writes (or replaces) the SHA the ref of the repository resolved to.
   */
  writeVersion(record: DependencyVersionRecord): Promise<void> {
    return writeDependencyVersion(this.#storage, record)
  }
}
