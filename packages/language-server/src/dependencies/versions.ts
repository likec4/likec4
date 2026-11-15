// Node-only: resolves refs of git dependencies to commit SHAs (version index).
// Imported only from `install.ts` (Node entry), never from the browser entry or common code.
import type { DependencyStorage } from './DependencyStorage'
import { type GitRunner, looksLikeAbbreviatedSha, lsRemoteRef, refAsFullSha } from './git'
import type { DependencyVersionRecord } from './types'

/**
 * Commit SHA a ref of a git dependency resolved to, see {@link resolveDependencyVersion}.
 */
export interface ResolvedDependencyVersion {
  /**
   * Full commit SHA (lower case)
   */
  sha: string
  /**
   * Where the SHA comes from:
   * - `index` - the version index (nothing was resolved)
   * - `sha` - the ref is a full commit SHA
   * - `remote` - resolved in the remote repository (`git ls-remote`)
   */
  source: 'index' | 'sha' | 'remote'
  /**
   * Full name of the remote ref (`refs/tags/v1`), only if resolved in the remote repository
   */
  refName?: string | undefined
}

/**
 * Parameters of {@link resolveDependencyVersion}
 */
export interface ResolveDependencyVersionParams {
  storage: DependencyStorage
  runGit: GitRunner
  /**
   * Identity of the repository (`host[:port]/path`)
   */
  repository: string
  /**
   * Repository with the remote `origin` (see `initGitRepository`): `ls-remote` runs inside it
   */
  dir: string
  /**
   * Ref as written in the config (validated by the caller)
   */
  ref: string
  /**
   * Resolve the ref again even if the version index has it (`likec4 update`)
   */
  update: boolean
  /**
   * Working directory of git
   */
  cwd: string
  signal?: AbortSignal | undefined
}

/**
 * Returns the commit SHA of the ref known without the remote repository:
 * the SHA of the version index, or the ref itself if it is a full SHA.
 * A full SHA of an annotated tag is recorded in the index with the SHA of its commit,
 * so the index is read first: an installed tag object is found without git.
 * Never runs git. Returns undefined if the ref has to be resolved in the remote repository.
 */
export async function knownDependencyVersion(
  storage: DependencyStorage,
  repository: string,
  ref: string,
): Promise<ResolvedDependencyVersion | undefined> {
  const record = await storage.readVersion(repository, ref)
  if (record) {
    return { sha: record.sha, source: 'index' }
  }
  const sha = refAsFullSha(ref)
  return sha ? { sha, source: 'sha' } : undefined
}

/**
 * Resolves the ref of a git dependency to a commit SHA:
 * 1. a full SHA: the version index or the SHA itself (git is not run, also with `update`: a SHA never moves);
 * 2. otherwise the SHA of the version index is used, unless `update`;
 * 3. otherwise the ref is resolved in the remote repository (`git ls-remote`: tags before branches,
 *    annotated tags are peeled to commits).
 *
 * Does not write the version index: the caller writes it once the instance is installed
 * (see {@link createDependencyVersionRecord}), so failures leave the index unchanged.
 *
 * @throws if the ref is not found in the remote repository, or git fails
 */
export async function resolveDependencyVersion(
  params: ResolveDependencyVersionParams,
): Promise<ResolvedDependencyVersion> {
  if (!params.update || refAsFullSha(params.ref)) {
    const known = await knownDependencyVersion(params.storage, params.repository, params.ref)
    if (known) {
      return known
    }
  }
  const resolved = await lsRemoteRef(params.runGit, params.dir, params.ref, {
    cwd: params.cwd,
    signal: params.signal,
  })
  if (!resolved) {
    const hint = looksLikeAbbreviatedSha(params.ref)
      ? ' (abbreviated commit SHAs are not supported, use the full SHA)'
      : ''
    throw new Error(`Ref ${JSON.stringify(params.ref)} not found in ${params.repository}${hint}`)
  }
  return { sha: resolved.sha, source: 'remote', refName: resolved.name }
}

/**
 * Creates the record of the version index: the ref of the repository resolved to the SHA.
 */
export function createDependencyVersionRecord(params: {
  repository: string
  url: string
  ref: string
  sha: string
  resolvedAt: Date
}): DependencyVersionRecord {
  return {
    format: 1,
    repository: params.repository,
    url: params.url,
    ref: params.ref,
    sha: params.sha,
    resolvedAt: params.resolvedAt.toISOString(),
  }
}
