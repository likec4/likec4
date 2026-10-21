import type { ProjectId } from '@likec4/core/types'
import { collapseUnchanged, diffLines } from '@likec4/core/utils'
import type { ApplyEditsResult, ModelEditPreview } from '@likec4/language-server'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'tinyrainbow'
import type { Range } from 'vscode-languageserver-types'
import type { LikeC4 } from '../LikeC4'
import type { Logger } from '../logger'
import { ensureProject } from './utils'

/**
 * The project selected with `--project`, or every project of the workspace.
 */
export function projectsToSearch(likec4: LikeC4, project: string | undefined): ProjectId[] {
  return project ? [ensureProject(likec4, project).projectId] : [...likec4.projects()]
}

/**
 * Finds the only project for which `isIn` is true.
 * Returns an error message if no project or more than one project matches.
 */
export async function findProject(
  projects: ReadonlyArray<ProjectId>,
  what: string,
  isIn: (projectId: ProjectId) => Promise<boolean>,
): Promise<{ projectId: ProjectId } | { error: string }> {
  const found: ProjectId[] = []
  for (const projectId of projects) {
    if (await isIn(projectId)) {
      found.push(projectId)
    }
  }
  const [only, ...others] = found
  if (only && others.length === 0) {
    return { projectId: only }
  }
  return {
    error: only ? `${what} exists in projects ${found.join(', ')}, select one with --project` : `${what} not found`,
  }
}

function displayPath(uri: string): string {
  return relative(process.cwd(), fileURLToPath(uri))
}

/**
 * `path:line:column` relative to the current directory
 */
export function displayLocation(uri: string, range: Range): string {
  return `${displayPath(uri)}:${range.start.line + 1}:${range.start.character + 1}`
}

/**
 * Prints the changes of the edit as a line diff per file.
 */
export function printPreview(preview: ModelEditPreview): void {
  const lines = [k.bold(`${preview.label} (dry run)`)]
  if (preview.documents.length === 0) {
    lines.push('No changes')
  }
  if (preview.overlaps.length > 0) {
    lines.push(
      '',
      k.yellow('Overlaps with other diffs (apply needs --accept-overlaps once their owners agreed):'),
      ...preview.overlaps.map(overlap => `  ${overlap}`),
    )
  }
  for (const document of preview.documents) {
    lines.push('', k.bold(`--- ${displayPath(document.uri)}`))
    for (const change of collapseUnchanged(diffLines(document.before, document.after), 2)) {
      switch (change.type) {
        case 'skipped':
          lines.push(k.dim(`@@ ${change.count} unchanged line(s) @@`))
          break
        case 'added':
          lines.push(k.green(`+ ${change.line}`))
          break
        case 'removed':
          lines.push(k.red(`- ${change.line}`))
          break
        default:
          lines.push(`  ${change.line}`)
      }
    }
  }
  process.stdout.write(lines.join('\n') + '\n')
}

/**
 * Prints the result of an edit (safe delete, apply or discard diff).
 * Sets the exit code to 1 if the edit failed or left errors.
 */
export function reportEditResult(logger: Logger, action: string, result: ApplyEditsResult): void {
  if (!result.applied) {
    logger.error(`${action} failed: ${result.error ?? 'nothing changed'}`)
    process.exitCode = 1
    return
  }
  if (result.remaining.length === 0) {
    logger.info(`${k.green(action)}: done, no errors left`)
    return
  }
  logger.warn(`${action}: done, ${result.remaining.length} error(s) left to fix manually`)
  for (const error of result.remaining) {
    const diff = error.diffId ? `diff ${error.diffId}: ` : ''
    logger.warn(`  ${displayLocation(error.uri, error.range)} ${diff}${error.message}`)
  }
  process.exitCode = 1
}
