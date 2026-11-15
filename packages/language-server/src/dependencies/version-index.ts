import { invariant } from '@likec4/core/utils'
import { isPlainObject } from 'remeda'
import type { Storage } from 'unstorage'
import { isGitSha } from '../workspace/dependency-uri'
import { encodeKeySegment, repositoryKeySegments } from './storage'
import type { DependencyVersionRecord } from './types'

/**
 * Prefix of keys of the version index in the dependency storage
 */
export const DEPENDENCY_VERSIONS_PREFIX = 'versions'

/**
 * Key of the version index record of a ref of a repository:
 *
 * ```
 * versions:<host[:port]>:<repository path segments>:<ref>
 * ```
 *
 * Each segment is URI-encoded (`release/1.0` is `release%2F1.0`), the ref is always the last segment.
 *
 * @example
 * ```ts
 * dependencyVersionKey('github.com/my-org/billing', 'main') // versions:github.com:my-org:billing:main
 * ```
 */
export function dependencyVersionKey(repository: string, ref: string): string {
  return [
    DEPENDENCY_VERSIONS_PREFIX,
    ...repositoryKeySegments(repository),
    encodeKeySegment(ref),
  ].join(':')
}

/**
 * Checks the shape of a version index record read from the storage.
 */
export function isDependencyVersionRecord(value: unknown): value is DependencyVersionRecord {
  return isPlainObject(value)
    && value['format'] === 1
    && typeof value['repository'] === 'string'
    && typeof value['url'] === 'string'
    && typeof value['ref'] === 'string'
    && typeof value['sha'] === 'string'
    && isGitSha(value['sha'])
    && typeof value['resolvedAt'] === 'string'
}

/**
 * Reads the SHA the ref of the repository resolved to.
 * Returns undefined if the ref was not resolved yet (or the record is malformed).
 */
export async function readDependencyVersion(
  storage: Storage,
  repository: string,
  ref: string,
): Promise<DependencyVersionRecord | undefined> {
  const value: unknown = await storage.getItem(dependencyVersionKey(repository, ref))
  return isDependencyVersionRecord(value) ? value : undefined
}

/**
 * Writes (or replaces) the SHA the ref of the repository resolved to.
 */
export async function writeDependencyVersion(storage: Storage, record: DependencyVersionRecord): Promise<void> {
  invariant(isDependencyVersionRecord(record), 'Invalid dependency version record')
  await storage.setItem(dependencyVersionKey(record.repository, record.ref), record)
}
