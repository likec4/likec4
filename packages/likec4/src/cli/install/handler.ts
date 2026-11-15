import {
  type DependencyInstallReport,
  formatGitDependencySource,
  installWorkspaceDependencies,
} from '@likec4/language-services/node'
import k from 'tinyrainbow'

export interface InstallOptions {
  /**
   * Workspace path
   */
  path: string
  /**
   * Consumer project, all projects if not set
   */
  project?: string | undefined
  /**
   * Import name of the dependency, all git dependencies if not set
   */
  name?: string | undefined
  /**
   * Resolve refs again (`likec4 update`)
   */
  update: boolean
}

export interface InstallLogger {
  info(msg: string): void
  error(msg: string): void
}

export interface InstallResult {
  /**
   * False if any dependency failed to install
   */
  ok: boolean
  reports: DependencyInstallReport[]
}

const short = (sha: string) => sha.slice(0, 12)

/**
 * Formats the result of a dependency: `'billing' of project 'cloud'`, the source and what happened
 */
export function formatInstallReport(report: DependencyInstallReport, update: boolean): string {
  const { projectId, name, source, previousSha, result } = report
  const subject = `${k.bold(name)} ${k.dim(`of project '${projectId}' (${formatGitDependencySource(source)})`)}`
  switch (result.status) {
    case 'installed': {
      const sha = result.instance.sha
      switch (true) {
        case previousSha !== undefined && previousSha !== sha:
          return `${k.green('✓')} ${subject} updated ${short(previousSha)} → ${short(sha)}`
        case previousSha !== undefined:
          return `${k.green('✓')} ${subject} ${update ? 'up to date' : 'already installed'} at ${short(sha)}`
        case result.cached:
          return `${k.green('✓')} ${subject} already installed at ${short(sha)}`
        default:
          return `${k.green('✓')} ${subject} installed at ${short(sha)} (${result.files} files)`
      }
    }
    case 'failed':
      return `${k.red('✗')} ${subject} failed: ${result.error}`
    case 'unsupported':
      return `${k.red('✗')} ${subject} cannot be installed: git dependencies are not supported`
  }
}

/**
 * Installs (or updates) git dependencies of the workspace into the cache and prints the result of each.
 * Only `likec4 install` and `likec4 update` download dependencies.
 */
export async function runInstall(options: InstallOptions, logger: InstallLogger): Promise<InstallResult> {
  const reports = await installWorkspaceDependencies(options.path, {
    project: options.project,
    name: options.name,
    update: options.update,
  })
  if (reports.length === 0) {
    logger.info('no git dependencies')
    return { ok: true, reports }
  }
  let ok = true
  for (const report of reports) {
    const line = formatInstallReport(report, options.update)
    if (report.result.status === 'installed') {
      logger.info(line)
    } else {
      ok = false
      logger.error(line)
    }
  }
  return { ok, reports }
}

/**
 * Exits the process on SIGINT and SIGTERM while `run` is running:
 * the exit hook of the git installer kills running git processes.
 */
export async function exitOnSignals<T>(run: () => Promise<T>): Promise<T> {
  const onSigint = () => process.exit(130)
  const onSigterm = () => process.exit(143)
  process.once('SIGINT', onSigint)
  process.once('SIGTERM', onSigterm)
  try {
    return await run()
  } finally {
    process.off('SIGINT', onSigint)
    process.off('SIGTERM', onSigterm)
  }
}
