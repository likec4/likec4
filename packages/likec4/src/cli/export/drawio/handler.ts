import type { ProjectId } from '@likec4/core/types'
import { generateDrawio } from '@likec4/generators'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { LikeC4 } from '../../../LikeC4'
import { createLikeC4Logger, startTimer } from '../../../logger'
import { LikeC4Model } from '../../../model'
import { path, project, useDotBin } from '../../options'

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
        .options({
          project,
          'use-dot': useDotBin,
        })
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export drawio')}
    ${k.gray('Export all views to DrawIO in current directory')}

  ${k.green('$0 export drawio -o ./diagrams src/')}
    ${k.gray('Export views to ./diagrams/')}
`),
    handler: async args => {
      const outdir = args.outdir ?? args.path
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

      let succeeded = 0
      for (const vm of model.views()) {
        const view = vm.$view
        try {
          const generated = generateDrawio(vm)
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

      timer.stopAndLog(`✓ export drawio in `)
    },
  })
}
