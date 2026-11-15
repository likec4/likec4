import type { GitDependencySource } from '@likec4/config'
import type { ProjectId } from '@likec4/core/types'
import type { Cancellation } from 'langium'
import type { Storage } from 'unstorage'
import type { LikeC4SharedServices } from '../module'
import type { GitDependencyInstance } from '../workspace/dependency-uri'
import type { ExternalProjectId } from '../workspace/ExternalProjects'

export type { GitDependencySource } from '@likec4/config'
export type { GitDependencyInstance } from '../workspace/dependency-uri'

/**
 * Record of an installed git dependency instance in the dependency storage,
 * under the key {@link dependencyCacheKey} of its instance.
 *
 * Records are immutable (the content of a commit never changes) and shared by all projects.
 * The instance is installed when the record exists: the record is written once, after all files are read.
 */
export interface DependencyCacheEntry {
  /**
   * Version of the record format
   */
  format: 1
  /**
   * Identity of the repository (`host[:port]/path`)
   */
  repository: string
  /**
   * Repository URL the instance was installed from (as written in the config)
   */
  url: string
  /**
   * Commit SHA
   */
  sha: string
  /**
   * Subdirectory of the repository, `''` for the root (see `normalizeGitSubdir`)
   */
  subdir: string
  /**
   * Files of the instance: path relative to the subdirectory (forward slashes) -> text.
   * Contains only `.c4` and `.likec4` documents and the JSON config.
   */
  files: Record<string, string>
}

/**
 * Record of the version index: the commit SHA a ref of a repository resolved to.
 * Stored in the dependency storage under the key {@link dependencyVersionKey}.
 *
 * Until the lock file, versions are reproducible on one machine only:
 * all projects with the same repository and ref get the same SHA, `update` moves it for all of them.
 */
export interface DependencyVersionRecord {
  /**
   * Version of the record format
   */
  format: 1
  /**
   * Identity of the repository (`host[:port]/path`)
   */
  repository: string
  /**
   * Repository URL the ref was resolved with (as written in the config)
   */
  url: string
  /**
   * Git ref as written in the config (branch, tag or SHA)
   */
  ref: string
  /**
   * Commit SHA the ref resolved to
   */
  sha: string
  /**
   * When the ref was resolved (ISO 8601)
   */
  resolvedAt: string
}

/**
 * Options of {@link DependencyInstaller.install}
 */
export interface DependencyInstallOptions {
  /**
   * Resolve the ref again, even if the version index has a SHA for it (`likec4 update`)
   * @default false
   */
  update?: boolean | undefined
  cancelToken?: Cancellation.CancellationToken | undefined
}

/**
 * Result of installing a git dependency
 * - `installed` - the instance is in the storage (installed now, or found in the storage)
 * - `failed` - git failed, or the source is invalid
 * - `unsupported` - the host cannot install dependencies (e.g. browser)
 */
export type DependencyInstallResult =
  | {
    status: 'installed'
    instance: GitDependencyInstance
    /**
     * Number of files in the instance
     */
    files: number
    /**
     * Whether the instance was already in the storage (nothing was downloaded)
     */
    cached: boolean
  }
  | {
    status: 'failed'
    error: string
  }
  | {
    status: 'unsupported'
  }

/**
 * Installs git dependencies into the dependency storage: resolves the ref to a SHA (version index),
 * downloads the subdirectory at the SHA and writes {@link DependencyCacheEntry}.
 *
 * Runs git and network: must be called outside of the workspace write-lock,
 * and only as an explicit action (the language server never installs by itself).
 * Does not register instances: after install, the caller requests a sync of external projects.
 */
export interface DependencyInstaller {
  /**
   * Whether the host can install dependencies (false in the browser)
   */
  readonly supported: boolean
  /**
   * Installs the git source (no-op if the instance is in the storage, unless `update`).
   * Never throws: errors are returned as `failed`.
   */
  install(source: GitDependencySource, options?: DependencyInstallOptions): Promise<DependencyInstallResult>
}

/**
 * State of a git dependency of a consumer project (the pair "consumer, import name"):
 * - `installed` - the instance is registered
 * - `not-installed` - there is no SHA for the ref in the version index, or no instance in the storage
 * - `unsupported` - the host does not support git dependencies (e.g. browser)
 */
export type DependencyState =
  | {
    status: 'installed'
    consumer: ProjectId
    name: string
    source: GitDependencySource
    instance: GitDependencyInstance
    /**
     * Internal id of the registered instance
     */
    projectId: ExternalProjectId
    /**
     * Number of documents of the instance with parse errors
     */
    filesWithErrors: number
  }
  | {
    status: 'not-installed'
    consumer: ProjectId
    name: string
    source: GitDependencySource
  }
  | {
    status: 'unsupported'
    consumer: ProjectId
    name: string
    source: GitDependencySource
  }

export type DependencyStatus = DependencyState['status']

/**
 * Context of the dependencies module: storage and installer provided by the host.
 */
export interface DependenciesModuleContext {
  /**
   * Creates the backing storage of git dependencies.
   * In-memory by default; Node hosts use the unstorage `fs` driver in the cache directory
   * (see {@link dependencyCacheDir}), VS Code replaces it with the client storage after `initialize`.
   */
  dependencyStorage: (services: LikeC4SharedServices) => Storage
  /**
   * Creates the installer of git dependencies.
   * Not supported by default (browser, tests).
   */
  dependencyInstaller: (services: LikeC4SharedServices) => DependencyInstaller
}
