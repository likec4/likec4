import { invariant } from '@likec4/core/utils'
import { isPlainObject } from 'remeda'
import { type Storage, createStorage } from 'unstorage'
import { type GitDependencyInstance, isFullGitSha, normalizeGitSubdir } from '../workspace/dependency-uri'
import type { DependencyCacheEntry } from './types'

/**
 * Prefix of keys of installed instances in the dependency storage
 */
export const DEPENDENCY_INSTANCES_PREFIX = 'instances'

// Windows reserved device names (also with an extension, e.g. "con.c4")
const WINDOWS_RESERVED_NAME_REGEX = /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/

function percentEscape(char: string): string {
  return `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`
}

/**
 * Injective encoding of a key segment, safe as a file name on case-insensitive and Windows file systems:
 * 1. URI-encodes (`:`, `/`, `\`, `?`, `<`, `>`, `"`, `|`, spaces and control characters become escapes),
 *    and escapes `*` (`%2a`);
 * 2. lower-cases hex digits of escapes and prefixes upper case letters with `^` (`Main` -> `^main`);
 * 3. escapes a trailing `.` (`a.` -> `a%2e`, so no segment ends with `..` or `.`);
 * 4. escapes the first character of Windows reserved names (`con` -> `%63on`, `nul.c4` -> `%6eul.c4`).
 *
 * `%` and `^` of the input are always escaped (`%25`, `%5e`) and every other change is a percent escape,
 * so the encoding is unambiguous (decoding: drop `^` before letters, then URI-decode).
 */
function fileSafeEncode(value: string): string {
  let encoded = encodeURIComponent(value)
    .replaceAll('*', '%2a')
    .replace(/%[0-9A-F]{2}/g, escape => escape.toLowerCase())
    .replace(/[A-Z]/g, letter => `^${letter.toLowerCase()}`)
  if (encoded.endsWith('.')) {
    encoded = `${encoded.slice(0, -1)}%2e`
  }
  if (WINDOWS_RESERVED_NAME_REGEX.test(encoded)) {
    encoded = `${percentEscape(encoded.charAt(0))}${encoded.slice(1)}`
  }
  return encoded
}

/**
 * Encodes a key segment (see `fileSafeEncode`):
 * - unstorage treats `:`, `/` and `\` as separators and drops everything after `?`,
 *   the `fs-lite` driver maps segments to folders and rejects keys with segments ending in `..`;
 * - file systems of macOS and Windows are case-insensitive: upper case letters are escaped
 *   (`Main` -> `^main`, `%2F` -> `%2f`), so `Main` and `main` never share a file;
 * - Windows forbids `<>:"|?*`, trailing dots and spaces, and reserved names (`con`, `nul`, `com1`, ...):
 *   they are escaped.
 */
export function encodeKeySegment(segment: string): string {
  invariant(segment.length > 0 && segment !== '.' && segment !== '..', `Invalid storage key segment: "${segment}"`)
  return fileSafeEncode(segment)
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
 * Each segment is encoded with {@link encodeKeySegment} (`:` of the port is `%3a`, `/` of the subdirectory is `%2f`,
 * upper case letters are prefixed with `^`), the subdirectory segment is `@` for the repository root.
 * The last two segments are always the SHA and the subdirectory, so keys are unambiguous.
 *
 * @example
 * ```ts
 * dependencyCacheKey({ repository: 'github.com/my-org/billing', sha: '<full sha>', subdir: 'docs/arch' })
 * // instances:github.com:my-org:billing:<sha>:@docs%2farch
 * ```
 */
export function dependencyCacheKey(instance: GitDependencyInstance): string {
  invariant(isFullGitSha(instance.sha), `Git dependency requires a full commit SHA: ${instance.sha}`)
  const subdir = normalizeGitSubdir(instance.subdir)
  return [
    DEPENDENCY_INSTANCES_PREFIX,
    ...repositoryKeySegments(instance.repository),
    instance.sha,
    `@${fileSafeEncode(subdir)}`,
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
