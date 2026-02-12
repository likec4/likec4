import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ProjectId } from '@likec4/core/types'
import type { GenerateDrawioOptions } from '@likec4/generators'
import {
  buildDrawioExportOptionsFromSource,
  generateDrawio,
  generateDrawioMulti,
} from '@likec4/generators'
import { loggable } from '@likec4/log'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { LikeC4 } from '../../../LikeC4'
import { type ViteLogger, createLikeC4Logger, startTimer } from '../../../logger'
import { LikeC4Model } from '../../../model'
import { path, project, useDotBin } from '../../options'

/** File extension for DrawIO files (single source of truth in CLI). */
const DRAWIO_FILE_EXT = '.drawio'
/** Default filename when exporting all views into one file. */
const DEFAULT_DRAWIO_ALL_FILENAME = 'diagrams.drawio'

async function readWorkspaceSourceContent(workspacePath: string): Promise<string> {
  const chunks: string[] = []
  const ext = (f: string) => f.endsWith('.c4') || f.endsWith('.likec4')
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name !== 'node_modules' && e.name !== '.git') await walk(full)
      } else if (e.isFile() && ext(e.name)) {
        const content = await readFile(full, 'utf-8').catch(() => '')
        if (content) chunks.push(content)
      }
    }
  }
  await walk(workspacePath)
  return chunks.join('\n\n')
}

/** Single place for roundtrip source: only reads workspace when roundtrip is true (DRY). */
async function getSourceContentIfRoundtrip(
  workspacePath: string,
  roundtrip: boolean,
): Promise<string | undefined> {
  if (!roundtrip) return undefined
  return readWorkspaceSourceContent(resolve(workspacePath))
}

/** Build per-view export options from optional source (DRY for all-in-one and per-view). */
function buildOptionsByViewId(
  viewmodels: LikeC4ViewModel<aux.Unknown>[],
  sourceContent: string | undefined,
  uncompressed: boolean,
): Record<string, GenerateDrawioOptions> {
  const optionsByViewId: Record<string, GenerateDrawioOptions> = {}
  const overrides = uncompressed ? { compressed: false } : undefined
  for (const vm of viewmodels) {
    const viewId = vm.$view.id as string
    optionsByViewId[viewId] = buildDrawioExportOptionsFromSource(viewId, sourceContent, overrides)
  }
  return optionsByViewId
}

/** Export all views as one .drawio file (one tab per view). */
async function exportDrawioAllInOne(params: {
  viewmodels: LikeC4ViewModel<aux.Unknown>[]
  outdir: string
  workspacePath: string
  roundtrip: boolean
  uncompressed: boolean
  logger: ViteLogger
}): Promise<void> {
  const { viewmodels, outdir, workspacePath, roundtrip, uncompressed, logger } = params
  const sourceContent = await getSourceContentIfRoundtrip(workspacePath, roundtrip)
  const optionsByViewId = buildOptionsByViewId(viewmodels, sourceContent, uncompressed)
  const generated = generateDrawioMulti(viewmodels, optionsByViewId)
  const outfile = resolve(outdir, DEFAULT_DRAWIO_ALL_FILENAME)
  await writeFile(outfile, generated)
  logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)} (${viewmodels.length} tab(s))`)
}

/** Export each view to a separate .drawio file. */
async function exportDrawioPerView(params: {
  viewmodels: LikeC4ViewModel<aux.Unknown>[]
  outdir: string
  workspacePath: string
  roundtrip: boolean
  uncompressed: boolean
  logger: ViteLogger
}): Promise<{ succeeded: number }> {
  const { viewmodels, outdir, workspacePath, roundtrip, uncompressed, logger } = params
  const sourceContent = await getSourceContentIfRoundtrip(workspacePath, roundtrip)
  const optionsByViewId = buildOptionsByViewId(viewmodels, sourceContent, uncompressed)
  let succeeded = 0
  for (const vm of viewmodels) {
    const viewId = vm.$view.id as string
    try {
      const generated = generateDrawio(vm, optionsByViewId[viewId])
      const outfile = resolve(outdir, viewId + DRAWIO_FILE_EXT)
      await writeFile(outfile, generated)
      logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)
      succeeded++
    } catch (err) {
      logger.error(`Failed to export view ${viewId}`, {
        error: err instanceof Error ? err : new Error(loggable(err)),
      })
    }
  }
  return { succeeded }
}

type DrawioExportArgs = {
  path: string
  outdir: string
  allInOne: boolean
  roundtrip: boolean
  uncompressed: boolean
  project: string | undefined
}

/** Run the export workflow: init workspace, load model, then delegate to all-in-one or per-view (single responsibility). */
async function runExportDrawio(args: DrawioExportArgs, logger: ViteLogger): Promise<void> {
  const timer = startTimer(logger)
  const likec4 = await LikeC4.fromWorkspace(args.path, {
    logger,
    graphviz: useDotBin ? 'binary' : 'wasm',
    watch: false,
  })
  likec4.ensureSingleProject()

  const projectId: ProjectId | undefined = args.project != null
    ? likec4.languageServices.projectsManager.ensureProjectId(args.project as ProjectId)
    : undefined
  const model = await likec4.layoutedModel(projectId)
  if (model === LikeC4Model.EMPTY) {
    logger.error('No project or empty model')
    throw new Error('No project or empty model')
  }

  await mkdir(args.outdir, { recursive: true })
  const viewmodels = [...model.views()]

  const exportParams = {
    viewmodels,
    outdir: args.outdir,
    workspacePath: args.path,
    roundtrip: args.roundtrip,
    uncompressed: args.uncompressed,
    logger,
  }

  if (args.allInOne && viewmodels.length > 0) {
    try {
      await exportDrawioAllInOne(exportParams)
    } catch (err) {
      logger.error('Failed to export DrawIO', {
        error: err instanceof Error ? err : new Error(loggable(err)),
      })
    }
  } else {
    const { succeeded } = await exportDrawioPerView(exportParams)
    if (succeeded > 0) logger.info(`${k.dim('total')} ${succeeded} DrawIO file(s)`)
  }

  timer.stopAndLog(`✓ export drawio in `)
}

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
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export drawio')}
    ${k.gray('Export each view to a separate .drawio file')}

  ${k.green('$0 export drawio --all-in-one -o ./diagrams src/')}
    ${k.gray('Export all views as tabs in one .drawio file')}

  ${k.green('$0 export drawio --roundtrip -o ./out')}
    ${k.gray('Re-apply layout/waypoints from comment blocks (e.g. after import from DrawIO)')}

  ${k.green('$0 export drawio --uncompressed -o ./out')}
    ${k.gray('Export with raw XML (no compression) for draw.io desktop compatibility')}
`),
    handler: async args => {
      const logger = createLikeC4Logger('c4:export')
      await runExportDrawio(
        {
          path: args.path,
          outdir: args.outdir ?? args.path,
          allInOne: args.allInOne === true,
          roundtrip: args.roundtrip === true,
          uncompressed: args.uncompressed === true,
          project: args.project,
        },
        logger,
      )
    },
  })
}
