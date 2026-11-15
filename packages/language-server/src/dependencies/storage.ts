import { invariant } from '@likec4/core/utils'
import { isPlainObject } from 'remeda'
import { type Storage, createStorage } from 'unstorage'
import { type GitDependencyInstance, isGitSha, normalizeGitSubdir } from '../workspace/dependency-uri'
import type { DependencyCacheEntry } from './types'

/**
 * Prefix of keys of installed instances in the dependency storage
 */
export const DEPENDENCY_INSTANCES_PREFIX = 'instances'

/**
 * Encodes a key segment: unstorage treats `:`, `/` and `\` as separators and drops everything after `?`,
 * the `fs` driver maps segments to folders.
 */
export function encodeKeySegment(segment: string): string {
  invariant(segment.length > 0 && segment !== '.' && segment !== '..', `Invalid storage key segment: "${segment}"`)
  return encodeURIComponent(segment)
}

/**
 * Key segments of the repository identity (`host[:port]/path`): one encoded segment per path segment.
 */
export function repositoryKeySegments(repository: string): string[] {
  const segments = repository.split('/').filter(s => s.length > 0)
  invariant(segments.length >= 2, `Invalid git repository identity: ${repository}`)
  return segments.map(encodeKeySegment)
}

/**
 * Key of the installed instance (the triple "repository, SHA, subdirectory") in the dependency storage:
 *
 * ```
 * instances:<host[:port]>:<repository path segments>:<sha>:@<subdir>
 * ```
 *
 * Each segment is URI-encoded (`:` of the port is `%3A`, `/` of the subdirectory is `%2F`),
 * the subdirectory segment is `@` for the repository root.
 * The last two segments are always the SHA and the subdirectory, so keys are unambiguous.
 *
 * @example
 * ```ts
 * dependencyCacheKey({ repository: 'github.com/my-org/billing', sha: 'abc1234', subdir: 'docs/arch' })
 * // instances:github.com:my-org:billing:abc1234:@docs%2Farch
 * ```
 */
export function dependencyCacheKey(instance: GitDependencyInstance): string {
  invariant(isGitSha(instance.sha), `Invalid commit SHA of a git dependency: ${instance.sha}`)
  const subdir = normalizeGitSubdir(instance.subdir)
  return [
    DEPENDENCY_INSTANCES_PREFIX,
    ...repositoryKeySegments(instance.repository),
    instance.sha,
    `@${encodeURIComponent(subdir)}`,
  ].join(':')
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isPlainObject(value) && Object.values(value).every(v => typeof v === 'string')
}

/**
 * Checks the shape of a record read from the storage.
 */
export function isDependencyCacheEntry(value: unknown): value is DependencyCacheEntry {
  return isPlainObject(value)
    && value['format'] === 1
    && typeof value['repository'] === 'string'
    && typeof value['url'] === 'string'
    && typeof value['sha'] === 'string'
    && typeof value['subdir'] === 'string'
    && isStringRecord(value['files'])
}

/**
 * Reads the installed instance from the storage.
 * Returns undefined if the instance is not installed (or the record is malformed).
 */
export async function readDependencyCacheEntry(
  storage: Storage,
  instance: GitDependencyInstance,
): Promise<DependencyCacheEntry | undefined> {
  const value: unknown = await storage.getItem(dependencyCacheKey(instance))
  return isDependencyCacheEntry(value) ? value : undefined
}

/**
 * Reads several installed instances with one batch request.
 * Returns records in the order of the instances, undefined for instances that are not installed.
 */
export async function readDependencyCacheEntries(
  storage: Storage,
  instances: ReadonlyArray<GitDependencyInstance>,
): Promise<Array<DependencyCacheEntry | undefined>> {
  if (instances.length === 0) {
    return []
  }
  const keys = instances.map(dependencyCacheKey)
  const items = await storage.getItems(keys)
  const byKey = new Map<string, unknown>(items.map(({ key, value }) => [key, value]))
  return keys.map(key => {
    const value = byKey.get(key)
    return isDependencyCacheEntry(value) ? value : undefined
  })
}

/**
 * Checks if the instance is installed (its record exists in the storage).
 */
export async function hasDependencyCacheEntry(storage: Storage, instance: GitDependencyInstance): Promise<boolean> {
  return await readDependencyCacheEntry(storage, instance) !== undefined
}

/**
 * Writes the record of an installed instance (under {@link dependencyCacheKey}).
 */
export async function writeDependencyCacheEntry(storage: Storage, entry: DependencyCacheEntry): Promise<void> {
  invariant(isDependencyCacheEntry(entry), 'Invalid dependency cache entry')
  invariant(entry.subdir === normalizeGitSubdir(entry.subdir), `Subdirectory is not normalized: ${entry.subdir}`)
  await storage.setItem(dependencyCacheKey(entry), entry)
}

/**
 * Creates an in-memory dependency storage (default when the host provides none).
 */
export function createMemoryDependencyStorage(): Storage {
  return createStorage()
}
