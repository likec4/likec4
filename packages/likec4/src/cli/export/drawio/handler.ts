import type { ProjectId } from '@likec4/core/types'
import type { GenerateDrawioOptions } from '@likec4/generators'
import { generateDrawio, generateDrawioMulti, parseDrawioRoundtripComments } from '@likec4/generators'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { LikeC4 } from '../../../LikeC4'
import { createLikeC4Logger, startTimer } from '../../../logger'
import { LikeC4Model } from '../../../model'
import { path, project, useDotBin } from '../../options'

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
      const outdir = args.outdir ?? args.path
      const allInOne = args.allInOne === true
      const roundtrip = args.roundtrip === true
      const uncompressed = args.uncompressed === true
      const onlyProject = args.project
      const logger = createLikeC4Logger('c4:export')

      const timer = startTimer(logger)
      const likec4 = await LikeC4.fromWorkspace(args.path, {
        logger,
        graphviz: useDotBin ? 'binary' : 'wasm',
        watch: false,
      })

      likec4.ensureSingleProject()

      const projectId: ProjectId | undefined = onlyProject != null
        ? likec4.languageServices.projectsManager.ensureProjectId(onlyProject as ProjectId)
        : undefined
      const model = await likec4.layoutedModel(projectId)
      if (model === LikeC4Model.EMPTY) {
        logger.error('No project or empty model')
        throw new Error('No project or empty model')
      }

      await mkdir(outdir, { recursive: true })

      const viewmodels = [...model.views()]

      if (allInOne && viewmodels.length > 0) {
        try {
          let optionsByViewId: Record<string, GenerateDrawioOptions> | undefined
          if (roundtrip || uncompressed) {
            if (roundtrip) {
              const sourceContent = await readWorkspaceSourceContent(resolve(args.path))
              const roundtripData = parseDrawioRoundtripComments(sourceContent)
              if (roundtripData) {
                optionsByViewId = {}
                for (const vm of viewmodels) {
                  const view = vm.$view
                  const opts: GenerateDrawioOptions = {}
                  const layoutForView = roundtripData.layoutByView[view.id]?.nodes
                  if (layoutForView != null) opts.layoutOverride = layoutForView
                  if (Object.keys(roundtripData.strokeColorByFqn).length > 0) {
                    opts.strokeColorByNodeId = roundtripData.strokeColorByFqn
                  }
                  if (Object.keys(roundtripData.strokeWidthByFqn).length > 0) {
                    opts.strokeWidthByNodeId = roundtripData.strokeWidthByFqn
                  }
                  if (Object.keys(roundtripData.edgeWaypoints).length > 0) {
                    opts.edgeWaypoints = roundtripData.edgeWaypoints
                  }
                  if (uncompressed) opts.compressed = false
                  optionsByViewId[view.id] = opts
                }
              }
            }
            if (uncompressed && !optionsByViewId) {
              optionsByViewId = {}
              for (const vm of viewmodels) {
                optionsByViewId[vm.$view.id] = { compressed: false }
              }
            }
          }
          const generated = generateDrawioMulti(viewmodels, optionsByViewId)
          const outfile = resolve(outdir, 'diagrams.drawio')
          await writeFile(outfile, generated)
          logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)} (${viewmodels.length} tab(s))`)
        } catch (err) {
          logger.error('Failed to export DrawIO', {
            error: err instanceof Error ? err : new Error(String(err)),
          })
        }
      } else {
        let roundtripData: Awaited<ReturnType<typeof parseDrawioRoundtripComments>> = null
        if (roundtrip) {
          const sourceContent = await readWorkspaceSourceContent(resolve(args.path))
          roundtripData = parseDrawioRoundtripComments(sourceContent)
        }
        let succeeded = 0
        for (const vm of viewmodels) {
          const view = vm.$view
          try {
            let options: Parameters<typeof generateDrawio>[1] | undefined
            if (roundtripData || uncompressed) {
              options = {}
              if (uncompressed) options.compressed = false
              if (roundtripData) {
                const layoutForView = roundtripData.layoutByView[view.id]?.nodes
                if (layoutForView != null) options.layoutOverride = layoutForView
                if (Object.keys(roundtripData.strokeColorByFqn).length > 0) {
                  options.strokeColorByNodeId = roundtripData.strokeColorByFqn
                }
                if (Object.keys(roundtripData.strokeWidthByFqn).length > 0) {
                  options.strokeWidthByNodeId = roundtripData.strokeWidthByFqn
                }
                if (Object.keys(roundtripData.edgeWaypoints).length > 0) {
                  options.edgeWaypoints = roundtripData.edgeWaypoints
                }
              }
            }
            const generated = generateDrawio(vm, options)
            const outfile = resolve(outdir, view.id + '.drawio')
            await writeFile(outfile, generated)
            logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)
            succeeded++
          } catch (err) {
            logger.error(`Failed to export view ${view.id}`, {
              error: err instanceof Error ? err : new Error(String(err)),
            })
          }
        }
        if (succeeded > 0) {
          logger.info(`${k.dim('total')} ${succeeded} DrawIO file(s)`)
        }
      }

      timer.stopAndLog(`✓ export drawio in `)
    },
  })
}
