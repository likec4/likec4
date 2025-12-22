/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComputedLikeC4ModelData, LayoutedLikeC4ModelData } from '@likec4/core'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { LikeC4 } from '../../../LikeC4'
import { createLikeC4Logger, startTimer } from '../../../logger'
import { LikeC4Model } from '../../../model'
import { path, project, useDotBin } from '../../options'

export function jsonCmd(yargs: Argv) {
  return yargs.command({
    command: 'json [path]',
    describe: 'export model(s) to JSON',
    builder: yargs =>
      yargs
        .positional('path', path)
        .option('outfile', {
          alias: 'o',
          type: 'string',
          desc: '<file> output .json file',
          default: 'likec4.json',
          normalize: true,
          coerce: resolve,
        })
        .options({
          project,
          'use-dot': useDotBin,
          'skip-layout': {
            type: 'boolean',
            desc: 'skip layouting (only compute model)',
          },
          'pretty': {
            type: 'boolean',
            desc: 'indented JSON output',
          },
        })
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export json --skip-layout')}
    ${k.gray('Search for likec4 files in current directory and output JSON to likec4.json (no layout)')}

  ${k.green('$0 export json --pretty -o ./generated/likec4.json src/likec4 ')}
    ${k.gray('Search for likec4 files in src/likec4 and output JSON to generated/likec4.json')}
`),
    handler: async args => {
      let outfile = args.outfile
      let onlyProject = args.project
      const logger = createLikeC4Logger('c4:export')

      const timer = startTimer(logger)
      const languageServices = await LikeC4.fromWorkspace(args.path, {
        logger,
        graphviz: useDotBin ? 'binary' : 'wasm',
        watch: false,
      })

      let projects = [...languageServices.projectsManager.all]
      if (onlyProject) {
        projects = projects.filter(p => p === onlyProject)
        if (!hasAtLeast(projects, 1)) {
          logger.error(`project not found: ${onlyProject}`)
          throw new Error(`project not found: ${onlyProject}`)
        }
      } else {
        if (!hasAtLeast(projects, 1)) {
          logger.error('No projects found')
          throw new Error('No projects found')
        }
        logger.info(`${k.dim('workspace:')} Found ${projects.length} projects`)
      }

      const projectsModels: Array<ComputedLikeC4ModelData | LayoutedLikeC4ModelData> = []
      for (const id of projects) {
        let model
        if (args.skipLayout) {
          logger.info(`Generate model for project ${k.green(id)} ${k.dim('(skip layout)')}`)
          model = await languageServices.computedModel(id)
        } else {
          logger.info(`Generating layouted model for project ${k.green(id)}`)
          model = await languageServices.layoutedModel(id)
        }
        if (model === LikeC4Model.EMPTY) {
          logger.warn(k.yellow(`Project ${id} is empty, skipping`))
          continue
        }
        projectsModels.push(model.$data)
      }

      if (extname(outfile) !== '.json') {
        outfile = outfile + '.json'
      }
      await mkdir(dirname(outfile), { recursive: true })

      // For single project, export just the model data
      // For multiple projects, export as an array of model data
      const toGenerate = projectsModels.length === 1
        ? projectsModels[0]
        : projectsModels

      const generatedSource = args.pretty
        ? JSON.stringify(toGenerate, undefined, 2)
        : JSON.stringify(toGenerate)

      await writeFile(outfile, generatedSource)

      const tolog = outfile.startsWith(args.path)
        ? relative(args.path, outfile)
        : outfile

      logger.info(`${k.dim('generated')} ${tolog}`)

      timer.stopAndLog(`✓ export in `)
    },
  })
}
