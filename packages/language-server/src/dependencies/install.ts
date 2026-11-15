// Node-only: installer of git dependencies (system git, shallow fetch, sparse checkout).
// Imported only from `node.ts` (Node entry), never from the browser entry.
import { type GitRepositoryUrl, isLikeC4JsonConfig, parseGitRepositoryUrl } from '@likec4/config'
import type { Cancellation } from 'langium'
import { lstat, mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { type GitDependencyInstance, normalizeGitSubdir } from '../workspace/dependency-uri'
import { type GitRunner, createGitRunner, fetchGitCommit, isValidGitRef, listGitSpecialFiles } from './git'
import type {
  DependencyCacheEntry,
  DependencyInstaller,
  DependencyInstallOptions,
  DependencyInstallResult,
  GitDependencySource,
} from './types'
import { createDependencyVersionRecord, knownDependencyVersion, resolveDependencyVersion } from './versions'

const logger = rootLogger.getChild(['dependencies', 'install'])

/**
 * Maximum number of files of one instance
 */
export const MAX_DEPENDENCY_FILES = 10_000

/**
 * Maximum total size of files of one instance (bytes)
 */
export const MAX_DEPENDENCY_SIZE = 64 * 1024 * 1024

const SOURCE_EXTENSIONS = ['.c4', '.likec4']

// Characters of a subdirectory that would change the meaning of a sparse checkout pattern
// eslint-disable-next-line no-control-regex
const UNSAFE_SUBDIR_REGEX = /[*?[\]\\!#\x00-\x1f\x7f]/

/**
 * Options of {@link GitDependencyInstaller}
 */
export interface GitDependencyInstallerOptions {
  /**
   * Runs git commands. Default: the system git ({@link createGitRunner})
   */
  runGit?: GitRunner | undefined
  /**
   * Maps the validated repository URL to the URL passed to git.
   * Default: the URL as written in the config.
   */
  remoteUrl?: ((url: GitRepositoryUrl, source: GitDependencySource) => string) | undefined
  /**
   * Parent directory of temporary checkouts
   * @default os.tmpdir()
   */
  tempDir?: string | undefined
  /**
   * Current time (for `resolvedAt` of the version index)
   */
  now?: (() => Date) | undefined
}

/**
 * Validated git source, see {@link validateGitDependencySource}
 */
export interface ValidatedGitDependencySource {
  source: GitDependencySource
  url: GitRepositoryUrl
  /**
   * Ref without surrounding whitespace
   */
  ref: string
  /**
   * Normalized subdirectory (`''` for the repository root)
   */
  subdir: string
}

/**
 * Validates the git source again, independently of the validation of the config:
 * the URL must be `https://`, `ssh://` or scp-like (`parseGitRepositoryUrl`),
 * the ref must be safe for git ({@link isValidGitRef}), the path must be a relative subdirectory.
 *
 * Returns the error message if the source is invalid.
 */
export function validateGitDependencySource(source: GitDependencySource): ValidatedGitDependencySource | string {
  if (typeof source.git !== 'string' || typeof source.ref !== 'string') {
    return 'Invalid git dependency source'
  }
  const url = parseGitRepositoryUrl(source.git)
  if (!url) {
    return `Invalid git repository URL "${
      redactGitUrl(source.git)
    }": only https://, ssh:// and git@host:org/repo.git are allowed`
  }
  const ref = source.ref.trim()
  if (!isValidGitRef(ref)) {
    return `Invalid git ref "${source.ref}"`
  }
  let subdir: string
  try {
    subdir = normalizeGitSubdir(source.path)
  } catch {
    return `Invalid path "${source.path}": must be a subdirectory of the repository`
  }
  if (UNSAFE_SUBDIR_REGEX.test(subdir) || subdir.split('/').some(s => s.startsWith('-'))) {
    return `Invalid path "${source.path}": unsupported characters`
  }
  return { source, url, ref, subdir }
}

/**
 * Removes credentials from a URL (`https://user:token@host/...` -> `https://***@host/...`) for messages and logs.
 */
export function redactGitUrl(url: string): string {
  return url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/@]*@/i, '$1***@')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isSourceFile(name: string): boolean {
  const lower = name.toLowerCase()
  return SOURCE_EXTENSIONS.some(ext => lower.endsWith(ext))
}

/**
 * Reads files of the instance from the checkout: `.c4` and `.likec4` documents at any depth,
 * JSON config files (`isLikeC4JsonConfig`) at the root of the instance only.
 * Executable configs, images and other files are skipped; symbolic links are never followed.
 *
 * @param root folder of the instance
 * @param skip paths relative to `root` to skip (e.g. symbolic links checked out as plain files)
 * @returns files by path relative to `root` (forward slashes)
 * @throws if there are more than {@link MAX_DEPENDENCY_FILES} files or {@link MAX_DEPENDENCY_SIZE} bytes
 */
export async function collectDependencyFiles(
  root: string,
  skip: ReadonlySet<string> = new Set(),
): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  let count = 0
  let size = 0
  const walk = async (dir: string, prefix: string): Promise<void> => {
    const entries = await readdir(dir, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      const path = join(dir, entry.name)
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name
      switch (true) {
        case entry.isDirectory(): {
          if (entry.name !== '.git') {
            await walk(path, relative)
          }
          break
        }
        // symbolic links, sockets, ...
        case !entry.isFile() || skip.has(relative):
          break
        case isSourceFile(entry.name) || (prefix === '' && isLikeC4JsonConfig(entry.name)): {
          const content = await readFile(path)
          count++
          size += content.byteLength
          if (count > MAX_DEPENDENCY_FILES || size > MAX_DEPENDENCY_SIZE) {
            throw new Error(
              `Dependency is too large (more than ${MAX_DEPENDENCY_FILES} files or ${MAX_DEPENDENCY_SIZE} bytes)`,
            )
          }
          files[relative] = content.toString('utf8')
          break
        }
      }
    }
  }
  await walk(root, '')
  return files
}

function abortSignalOf(token: Cancellation.CancellationToken | undefined): {
  signal: AbortSignal | undefined
  dispose: () => void
} {
  if (!token) {
    return { signal: undefined, dispose: () => {} }
  }
  const controller = new AbortController()
  if (token.isCancellationRequested) {
    controller.abort()
    return { signal: controller.signal, dispose: () => {} }
  }
  const listener = token.onCancellationRequested(() => controller.abort())
  return { signal: controller.signal, dispose: () => listener.dispose() }
}

/**
 * Installer of git dependencies for Node hosts.
 *
 * `install`:
 * 1. validates the source again ({@link validateGitDependencySource}), before git is run;
 * 2. resolves the ref to a commit SHA: a full SHA as is, the version index, or `git ls-remote`
 *    (always with `update`), see `resolveDependencyVersion`;
 * 3. if the instance is in the storage, only the version index is written (git is not run at all
 *    when the SHA is known without the remote);
 * 4. otherwise downloads the commit into a temporary directory (shallow fetch, sparse checkout of the path),
 *    writes `.c4`, `.likec4` files and the JSON config to the storage with one write,
 *    then writes the version index; the temporary directory is removed in any case.
 *
 * Failures leave the storage and the version index unchanged.
 * Concurrent installs of the same source share one run.
 */
export class GitDependencyInstaller implements DependencyInstaller {
  readonly supported: boolean = true

  readonly #runGit: GitRunner
  readonly #remoteUrl: (url: GitRepositoryUrl, source: GitDependencySource) => string
  readonly #tempDir: string | undefined
  readonly #now: () => Date
  readonly #inflight = new Map<string, Promise<DependencyInstallResult>>()

  constructor(protected services: LikeC4SharedServices, options?: GitDependencyInstallerOptions) {
    this.#runGit = options?.runGit ?? createGitRunner()
    this.#remoteUrl = options?.remoteUrl ?? ((_, source) => source.git.trim())
    this.#tempDir = options?.tempDir
    this.#now = options?.now ?? (() => new Date())
  }

  /**
   * Installs the git source. Never throws: errors are returned as `failed`.
   */
  install(source: GitDependencySource, options?: DependencyInstallOptions): Promise<DependencyInstallResult> {
    const validated = validateGitDependencySource(source)
    if (typeof validated === 'string') {
      logger.warn(validated)
      return Promise.resolve({ status: 'failed', error: validated })
    }
    const update = options?.update === true
    const key = JSON.stringify([validated.url.id, validated.ref, validated.subdir, update])
    const inflight = this.#inflight.get(key)
    if (inflight) {
      return inflight
    }
    const promise = this.#install(validated, update, options?.cancelToken)
      .catch((error: unknown): DependencyInstallResult => {
        const message = errorMessage(error)
        logger.warn(`Failed to install ${validated.url.id}#${validated.ref}: ${message}`)
        return { status: 'failed', error: message }
      })
      .finally(() => {
        this.#inflight.delete(key)
      })
    this.#inflight.set(key, promise)
    return promise
  }

  async #install(
    { source, url, ref, subdir }: ValidatedGitDependencySource,
    update: boolean,
    cancelToken: Cancellation.CancellationToken | undefined,
  ): Promise<DependencyInstallResult> {
    const storage = this.services.dependencies.Storage
    const repository = url.id
    const writeVersion = (sha: string) =>
      storage.writeVersion(createDependencyVersionRecord({
        repository,
        url: source.git,
        ref,
        sha,
        resolvedAt: this.#now(),
      }))

    // SHA known without the remote and the instance is installed: git is not run
    if (!update) {
      const known = await knownDependencyVersion(storage, repository, ref)
      if (known) {
        const instance: GitDependencyInstance = { repository, sha: known.sha, subdir }
        const entry = await storage.readEntry(instance)
        if (entry) {
          if (known.source === 'sha' && (await storage.readVersion(repository, ref))?.sha !== known.sha) {
            await writeVersion(known.sha)
          }
          return { status: 'installed', instance, files: Object.keys(entry.files).length, cached: true }
        }
      }
    }

    const { signal, dispose } = abortSignalOf(cancelToken)
    const remote = this.#remoteUrl(url, source)
    const temp = await mkdtemp(join(this.#tempDir ?? tmpdir(), 'likec4-git-'))
    try {
      const resolved = await resolveDependencyVersion({
        storage,
        runGit: this.#runGit,
        repository,
        remote,
        ref,
        update,
        cwd: temp,
        signal,
      })
      const existing = await storage.readEntry({ repository, sha: resolved.sha, subdir })
      if (existing) {
        if (resolved.source !== 'index') {
          await writeVersion(resolved.sha)
        }
        return {
          status: 'installed',
          instance: { repository, sha: resolved.sha, subdir },
          files: Object.keys(existing.files).length,
          cached: true,
        }
      }

      const checkout = join(temp, 'repo')
      await mkdir(checkout)
      logger.debug`fetching ${repository} at ${resolved.sha}`
      // the ref may move between ls-remote and fetch: the fetched commit wins
      const sha = await fetchGitCommit(this.#runGit, {
        remote,
        what: resolved.refName ?? resolved.sha,
        shaLength: resolved.sha.length,
        subdir,
        dir: checkout,
        signal,
      })

      const root = subdir ? join(checkout, ...subdir.split('/')) : checkout
      const stat = await lstat(root).catch(() => undefined)
      if (!stat?.isDirectory()) {
        throw new Error(`Path "${subdir}" not found in ${repository} at ${sha}`)
      }
      const prefix = subdir ? `${subdir}/` : ''
      const special = await listGitSpecialFiles(this.#runGit, { cwd: checkout, signal })
      const skip = new Set([...special].filter(p => p.startsWith(prefix)).map(p => p.slice(prefix.length)))
      const files = await collectDependencyFiles(root, skip)
      const count = Object.keys(files).length
      if (!Object.keys(files).some(isSourceFile)) {
        throw new Error(`No .c4 or .likec4 files in ${repository}${subdir ? ` (path "${subdir}")` : ''} at ${sha}`)
      }
      if (signal?.aborted) {
        throw new Error('Installation was cancelled')
      }
      const entry: DependencyCacheEntry = {
        format: 1,
        repository,
        url: source.git,
        sha,
        subdir,
        files,
      }
      // one write: the instance is either installed completely or not at all
      await storage.writeEntry(entry)
      if (resolved.source !== 'index' || sha !== resolved.sha) {
        await writeVersion(sha)
      }
      logger.info`installed ${repository}#${ref} at ${sha} (${count} files)`
      return { status: 'installed', instance: { repository, sha, subdir }, files: count, cached: false }
    } finally {
      dispose()
      await rm(temp, { recursive: true, force: true, maxRetries: 3 }).catch((error: unknown) => {
        logger.warn(`Failed to remove temporary directory ${temp}: ${errorMessage(error)}`)
      })
    }
  }
}

/**
 * Creates the installer of git dependencies for Node hosts
 * (`dependencyInstaller` of {@link WithNodeDependencies}).
 */
export function createGitDependencyInstaller(
  services: LikeC4SharedServices,
  options?: GitDependencyInstallerOptions,
): DependencyInstaller {
  return new GitDependencyInstaller(services, options)
}
