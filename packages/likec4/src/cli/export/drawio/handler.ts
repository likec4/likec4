import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ProjectId } from '@likec4/core/types'
import type { GenerateDrawioOptions } from '@likec4/generators'
import {
  buildDrawioExportOptionsForViews,
  DEFAULT_DRAWIO_ALL_FILENAME,
  generateDrawio,
  generateDrawioMulti,
} from '@likec4/generators'
import { fromWorkspace } from '@likec4/language-services/node'
import { loggable } from '@likec4/log'
import { mkdir, readdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { type ViteLogger, createLikeC4Logger, startTimer } from '../../../logger'
import { LikeC4Model } from '../../../model'
import { path, project, useDotBin } from '../../options'

/** File extension for DrawIO files (single source of truth in CLI). */
const DRAWIO_FILE_EXT = '.drawio'

/** Directories to skip when reading workspace for round-trip (single source of truth). */
const ROUNDTRIP_IGNORED_DIRS = new Set(['node_modules', '.git'])

/** Predicate: file is .c4 or .likec4 source (intent-revealing name). */
function isSourceFile(name: string): boolean {
  return name.endsWith('.c4') || name.endsWith('.likec4')
}

/** Join non-empty file content chunks with separator (single place for round-trip source assembly). */
function joinNonEmptyFiles(chunks: string[], separator = '\n\n'): string {
  return chunks.filter(c => c.trim() !== '').join(separator)
}

/** User-facing error messages (single source of truth for CLI contract). */
const ERR_EMPTY_MODEL = 'No project or empty model'
const ERR_EXPORT_FAILED = 'Failed to export DrawIO'
const ERR_NO_VIEWS_EXPORTED = 'No views could be exported'

/** Epilog examples for drawio command help (single source of truth). */
function getDrawioEpilog(): string {
  return `${k.bold('Examples:')}
  ${k.green('$0 export drawio')}
    ${k.gray('Export each view to a separate .drawio file')}

  ${k.green('$0 export drawio --all-in-one -o ./diagrams src/')}
    ${k.gray('Export all views as tabs in one .drawio file')}

  ${k.green('$0 export drawio --roundtrip -o ./out')}
    ${k.gray('Re-apply layout/waypoints from comment blocks (e.g. after import from DrawIO)')}

  ${k.green('$0 export drawio --uncompressed -o ./out')}
    ${k.gray('Export with raw XML (no compression) for draw.io desktop compatibility')}`
}

/** Normalize thrown value to Error for logging and rethrowing (single responsibility). */
function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(loggable(err))
}

/** Log error and rethrow so CLI exits with code 1 (align with PNG/JSON export). */
function logAndRethrow(logger: ViteLogger, message: string, err: unknown): never {
  const error = toError(err)
  logger.error(message, { error })
  throw error
}

/**
 * Read all .c4/.likec4 source in workspace for round-trip. Best-effort: readdir/readFile
 * failures are logged at debug (when logger provides debug) and skipped; partial content may be returned.
 *
 * Contract: when used from CLI with `--verbose`, the handler passes a full logger (createLikeC4Logger)
 * that implements `debug`; roundtrip read failures are then visible. ViteLogger type allows optional
 * `debug` for Vite compatibility; we only call debug when present.
 */
const ROUNDTRIP_MAX_DEPTH = 50

/** Walk workspace and concatenate .c4/.likec4 file contents; respects depth limit and symlink cycles. */
async function readWorkspaceSourceContent(
  workspacePath: string,
  logger?: ViteLogger,
): Promise<string> {
  const chunks: string[] = []
  const visitedDirs = new Set<string>()
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth >= ROUNDTRIP_MAX_DEPTH) return
    const dirReal = await realpath(dir).catch(() => null)
    if (dirReal == null) return
    if (visitedDirs.has(dirReal)) return
    visitedDirs.add(dirReal)
    const entries = await readdir(dir, { withFileTypes: true }).catch(err => {
      if (logger?.debug) logger.debug(`${k.dim('Roundtrip:')} readdir failed`, { dir, err })
      return []
    })
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        if (!ROUNDTRIP_IGNORED_DIRS.has(e.name)) await walk(full, depth + 1)
      } else if (e.isFile() && isSourceFile(e.name)) {
        const content = await readFile(full, 'utf-8').catch(err => {
          if (logger?.debug) logger.debug(`${k.dim('Roundtrip:')} readFile failed`, { file: full, err })
          return ''
        })
        if (content) chunks.push(content)
      }
    }
  }
  await walk(workspacePath, 0)
  return joinNonEmptyFiles(chunks)
}

/**
 * Single place for roundtrip source: only reads workspace when roundtrip is true.
 * @param workspacePath - Project root path
 * @param roundtrip - When true, reads and concatenates .c4/.likec4 files
 * @param logger - Optional logger for debug on read failures
 * @returns Concatenated source or undefined when roundtrip is false
 */
async function getSourceContentIfRoundtrip(
  workspacePath: string,
  roundtrip: boolean,
  logger?: ViteLogger,
): Promise<string | undefined> {
  if (!roundtrip) return undefined
  return readWorkspaceSourceContent(resolve(workspacePath), logger)
}

/**
 * Build per-view export options from optional source (delegates to shared generator).
 * @param viewmodels - Layouted view models
 * @param sourceContent - Concatenated .c4 source when roundtrip is enabled
 * @param uncompressed - When true, sets compressed: false in options
 * @returns Map of view id to GenerateDrawioOptions
 */
function buildOptionsByViewId(
  viewmodels: LikeC4ViewModel<aux.Unknown>[],
  sourceContent: string | undefined,
  uncompressed: boolean,
): Record<string, GenerateDrawioOptions> {
  const viewIds = viewmodels.map(vm => vm.$view.id as string)
  const overrides = uncompressed ? { compressed: false } : undefined
  return buildDrawioExportOptionsForViews(viewIds, sourceContent, overrides)
}

/**
 * Shared parameters for all-in-one and per-view export.
 * Passed to exportDrawioAllInOne and exportDrawioPerView.
 */
interface ExportDrawioParams {
  viewmodels: LikeC4ViewModel<aux.Unknown>[]
  outdir: string
  workspacePath: string
  roundtrip: boolean
  uncompressed: boolean
  logger: ViteLogger
}

/**
 * Export all views as one .drawio file (one tab per view).
 * @param params - View models, outdir, workspace path, roundtrip/uncompressed flags, logger
 */
async function exportDrawioAllInOne(params: ExportDrawioParams): Promise<void> {
  const { viewmodels, outdir, workspacePath, roundtrip, uncompressed, logger } = params
  const sourceContent = await getSourceContentIfRoundtrip(workspacePath, roundtrip, logger)
  const optionsByViewId = buildOptionsByViewId(viewmodels, sourceContent, uncompressed)
  const generated = generateDrawioMulti(viewmodels, optionsByViewId)
  const outfile = resolve(outdir, DEFAULT_DRAWIO_ALL_FILENAME)
  await writeFile(outfile, generated)
  logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)} (${viewmodels.length} tab(s))`)
}

/**
 * Write one view to a .drawio file; returns true on success, false on error (logs and continues).
 * @param vm - Layouted view model
 * @param optionsByViewId - Per-view export options
 * @param outdir - Output directory
 * @param logger - Logger for info/error
 * @returns True if file was written, false on error
 */
async function writeViewToFile(
  vm: LikeC4ViewModel<aux.Unknown>,
  optionsByViewId: Record<string, GenerateDrawioOptions>,
  outdir: string,
  logger: ViteLogger,
): Promise<boolean> {
  const viewId = vm.$view.id as string
  try {
    const generated = generateDrawio(vm, optionsByViewId[viewId])
    const outfile = resolve(outdir, viewId + DRAWIO_FILE_EXT)
    await writeFile(outfile, generated)
    logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)
    return true
  } catch (err) {
    logger.error(`Failed to export view ${viewId}`, { error: toError(err) })
    return false
  }
}

/**
 * Export each view to a separate .drawio file.
 * @param params - View models, outdir, workspace path, roundtrip/uncompressed flags, logger
 * @returns Count of successfully written files
 */
async function exportDrawioPerView(params: ExportDrawioParams): Promise<{ succeeded: number }> {
  const { viewmodels, outdir, workspacePath, roundtrip, uncompressed, logger } = params
  const sourceContent = await getSourceContentIfRoundtrip(workspacePath, roundtrip, logger)
  const optionsByViewId = buildOptionsByViewId(viewmodels, sourceContent, uncompressed)
  let succeeded = 0
  for (const vm of viewmodels) {
    if (await writeViewToFile(vm, optionsByViewId, outdir, logger)) succeeded++
  }
  return { succeeded }
}

/** CLI args for export drawio command (single type for handler and runExportDrawio). */
type DrawioExportArgs = {
  path: string
  outdir: string
  allInOne: boolean
  roundtrip: boolean
  uncompressed: boolean
  project: string | undefined
  useDot: boolean
}

/**
 * Run the export workflow: init workspace, load model, then delegate to all-in-one or per-view.
 * @param args - Parsed CLI args (path, outdir, allInOne, roundtrip, uncompressed, project, useDot)
 * @param logger - Logger for progress and errors
 */
async function runExportDrawio(args: DrawioExportArgs, logger: ViteLogger): Promise<void> {
  const timer = startTimer(logger)

  // 1) Init workspace (same fromWorkspace as build for consistent CI)
  await using likec4 = await fromWorkspace(args.path, {
    graphviz: args.useDot ? 'binary' : 'wasm',
    watch: false,
  })
  if (!args.project) {
    likec4.ensureSingleProject()
  }

  // 2) Load layouted model and validate non-empty
  const projectId: ProjectId | undefined = args.project != null
    ? likec4.languageServices.projectsManager.ensureProjectId(args.project as ProjectId)
    : undefined
  const model = await likec4.layoutedModel(projectId)
  if (model === LikeC4Model.EMPTY) {
    logger.error(ERR_EMPTY_MODEL)
    throw new Error(ERR_EMPTY_MODEL)
  }

  // 3) Prepare output dir and view list
  await mkdir(args.outdir, { recursive: true })
  const viewmodels = [...model.views()]

  const exportParams: ExportDrawioParams = {
    viewmodels,
    outdir: args.outdir,
    workspacePath: args.path,
    roundtrip: args.roundtrip,
    uncompressed: args.uncompressed,
    logger,
  }

  // 4) Export: all-in-one file or one file per view
  if (viewmodels.length === 0) {
    logger.warn('No views to export')
    throw new Error(ERR_NO_VIEWS_EXPORTED)
  }
  if (args.allInOne) {
    try {
      await exportDrawioAllInOne(exportParams)
    } catch (err) {
      logAndRethrow(logger, ERR_EXPORT_FAILED, err)
    }
  } else {
    const { succeeded } = await exportDrawioPerView(exportParams)
    if (succeeded === 0) {
      logger.error(ERR_NO_VIEWS_EXPORTED)
      throw new Error(ERR_NO_VIEWS_EXPORTED)
    }
    logger.info(`${k.dim('total')} ${succeeded} DrawIO file(s)`)
  }

  timer.stopAndLog(`✓ export drawio in `)
}

/**
 * Registers the `export drawio` subcommand with yargs.
 * Options: path, outdir, all-in-one, roundtrip, uncompressed, project, use-dot.
 * @param yargs - yargs instance to extend
 * @returns yargs chain for further commands
 */
export function drawioCmd(yargs: Argv) {
  return yargs.command({
    command: 'drawio [path]',
    describe: 'export view(s) to DrawIO (.drawio) for editing in draw.io',
    builder: yargs =>
      yargs
        .positional('path', path)
        .option('outdir', {
          alias: 'o',
          type: 'string',
          desc: '<dir> output directory for .drawio files',
          normalize: true,
          coerce: resolve,
        })
        .option('all-in-one', {
          type: 'boolean',
          default: false,
          desc: 'write one .drawio file with all views as tabs (diagrams)',
        })
        .option('roundtrip', {
          type: 'boolean',
          default: false,
          desc: 'apply layout/stroke/waypoints from DrawIO round-trip comment blocks in .c4 source',
        })
        .option('uncompressed', {
          type: 'boolean',
          default: false,
          desc:
            'write diagram XML uncompressed inside .drawio (larger file; use if draw.io desktop fails to open compressed export)',
        })
        .options({
          project,
          'use-dot': useDotBin,
        })
        .epilog(getDrawioEpilog()),
    handler: async args => {
      const logger = createLikeC4Logger('c4:export')
      await runExportDrawio(
        {
          path: args.path,
          outdir: args.outdir ?? args.path,
          allInOne: !!args.allInOne,
          roundtrip: !!args.roundtrip,
          uncompressed: !!args.uncompressed,
          project: args.project,
          useDot: !!args['use-dot'],
        },
        logger,
      )
    },
  })
}
