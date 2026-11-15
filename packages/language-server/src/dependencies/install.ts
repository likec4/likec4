// Node-only: installer of git dependencies (system git, shallow fetch, sparse checkout).
// Stub of the contracts package: it is filled by the installer package together with `git.ts` and `versions.ts`.
// Imported only from `node.ts` (Node entry), never from the browser entry.
import type { LikeC4SharedServices } from '../module'
import type { DependencyInstaller, DependencyInstallResult } from './types'

/**
 * Installer of git dependencies for Node hosts.
 *
 * Stub: reports `supported: false` and returns `unsupported`, i.e. Node hosts behave like hosts without git
 * until the installer is implemented.
 */
export class GitDependencyInstaller implements DependencyInstaller {
  readonly supported: boolean = false

  constructor(protected services: LikeC4SharedServices) {}

  install(): Promise<DependencyInstallResult> {
    return Promise.resolve({ status: 'unsupported' })
  }
}

/**
 * Creates the installer of git dependencies for Node hosts
 * (`dependencyInstaller` of {@link WithNodeDependencies}).
 */
export function createGitDependencyInstaller(services: LikeC4SharedServices): DependencyInstaller {
  return new GitDependencyInstaller(services)
}
