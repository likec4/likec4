import type { LikeC4, LikeC4Diagnostic } from '@likec4/language-services/node'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type { DiagnosticItem, ValidateResult } from './result'
import { buildValidateResult } from './result'

export interface ValidateOptions {
  /**
   * Workspace path, used to resolve source paths of views
   */
  path: string
  project?: string | undefined
  /**
   * Paths given with `--file`
   */
  file?: readonly string[] | undefined
  layout: boolean
  json: boolean
  maxWarnings?: number | undefined
}

export interface ValidateLogger {
  info(msg: string): void
  warn(msg: string): void
  error(msg: string): void
  debug(msg: string): void
}

const toDiagnosticItem = (d: LikeC4Diagnostic): DiagnosticItem => ({
  message: d.message,
  file: d.sourceFsPath,
  line: d.line,
  range: d.range,
})

/**
 * Formats a diagnostic as `file:line:column message`, with one-based line and column
 */
export function formatDiagnostic(d: DiagnosticItem): string {
  const position = d.range ? `:${d.range.start.line + 1}:${d.range.start.character + 1}` : ''
  return `${d.file}${position} ${d.message}`
}

/**
 * Validates the workspace loaded into `likec4` and prints the result.
 * Model errors are expected to be printed already by the language services in text mode.
 */
export async function runValidate(
  likec4: LikeC4,
  options: ValidateOptions,
  logger: ValidateLogger,
  print: (output: string) => void = console.log,
): Promise<ValidateResult> {
  const fileFilter = options.file?.map(f => resolve(f)) ?? null

  // Collect layout drift errors
  const layoutErrors: DiagnosticItem[] = []
  if (options.layout) {
    logger.debug('running layout validation...')
    try {
      const views = await likec4.diagrams(options.project)
      for (const view of views) {
        if (view.drifts && view.drifts.length > 0) {
          layoutErrors.push({
            message: `Layout drift detected on view '${view.id}'`,
            file: view.sourcePath ? resolve(options.path, view.sourcePath) : '',
            line: 0,
            range: null,
          })
        }
      }
    } catch (e) {
      layoutErrors.push({
        message: `Layout validation failed: ${e instanceof Error ? e.message : String(e)}`,
        file: '',
        line: 0,
        range: null,
      })
    }
  }

  const result = buildValidateResult({
    documents: likec4.documentPaths(),
    errors: [...likec4.getErrors().map(toDiagnosticItem), ...layoutErrors],
    warnings: likec4.getWarnings().map(toDiagnosticItem),
    fileFilter,
    maxWarnings: options.maxWarnings ?? null,
  })

  if (options.json) {
    print(JSON.stringify(result, null, 2))
    return result
  }

  // Layout drift errors (model errors already printed by handleInitOptions)
  for (const drift of layoutErrors) {
    logger.error(k.red(drift.message) + (drift.file ? ' at ' + drift.file : ''))
  }

  for (const warning of result.warnings) {
    logger.warn(k.yellow('Warning ') + formatDiagnostic(warning))
  }

  const { totalFiles, totalErrors, filteredErrors, filteredWarnings } = result.stats
  const warnings = filteredWarnings > 0 ? `, ${filteredWarnings} warnings` : ''
  const maxWarnings = result.maxWarnings !== null && filteredWarnings > result.maxWarnings
    ? ` (max ${result.maxWarnings})`
    : ''

  if (result.valid) {
    logger.info(k.green(`✓ Valid`) + k.dim(` (${totalFiles} files${warnings})`))
  } else {
    const filtered = fileFilter ? `, ${filteredErrors} in filtered files` : ''
    logger.error(
      k.red(`✗ Invalid`)
        + k.dim(` (${totalFiles} files, ${totalErrors} errors${filtered}${warnings}${maxWarnings})`),
    )
  }
  return result
}
