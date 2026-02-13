import type { ComputedLikeC4ModelData, LayoutedLikeC4ModelData } from '@likec4/core'
import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { LikeC4 } from '../../../LikeC4'
import { type ViteLogger, createLikeC4Logger, startTimer } from '../../../logger'
import { LikeC4Model } from '../../../model'
import { path, project, useDotBin } from '../../options'

const ERR_PROJECT_NOT_FOUND = 'project not found'
const ERR_NO_PROJECTS = 'No projects found'

type JsonExportArgs = {
  path: string
  outfile: string
  project: string | undefined
  skipLayout: boolean
  pretty: boolean
  useDot: boolean
}

/** Run the JSON export workflow: init workspace, load model(s), write to outfile. */
async function runExportJson(args: JsonExportArgs, logger: ViteLogger): Promise<void> {
  const timer = startTimer(logger)
  const languageServices = await LikeC4.fromWorkspace(args.path, {
    logger,
    graphviz: args.useDot ? 'binary' : 'wasm',
    watch: false,
  })

  let projects = [...languageServices.projectsManager.all]
  if (args.project) {
    projects = projects.filter(p => p === args.project)
    if (!hasAtLeast(projects, 1)) {
      logger.error(`${ERR_PROJECT_NOT_FOUND}: ${args.project}`)
      throw new Error(`${ERR_PROJECT_NOT_FOUND}: ${args.project}`)
    }
  } else {
    if (!hasAtLeast(projects, 1)) {
      logger.error(ERR_NO_PROJECTS)
      throw new Error(ERR_NO_PROJECTS)
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

  if (projectsModels.length === 0) {
    logger.warn('No models generated, aborting export')
    throw new Error('No models generated; all projects are empty or were skipped')
  }

  let outfile = args.outfile
  if (extname(outfile) !== '.json') outfile = outfile + '.json'
  await mkdir(dirname(outfile), { recursive: true })

  const toGenerate = projectsModels.length === 1 ? projectsModels[0] : projectsModels
  const generatedSource = args.pretty
    ? JSON.stringify(toGenerate, undefined, 2)
    : JSON.stringify(toGenerate)
  await writeFile(outfile, generatedSource)

  const tolog = outfile.startsWith(args.path) ? relative(args.path, outfile) : outfile
  logger.info(`${k.dim('generated')} ${tolog}`)
  timer.stopAndLog(`✓ export in `)
}

/** Registers the `export json` subcommand with yargs (path, outfile, project, skip-layout, pretty). */
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
      const logger = createLikeC4Logger('c4:export')
      await runExportJson(
        {
          path: args.path,
          outfile: args.outfile,
          project: args.project,
          skipLayout: !!args.skipLayout,
          pretty: !!args.pretty,
          useDot: !!args['use-dot'],
        },
        logger,
      )
    },
  })
}
