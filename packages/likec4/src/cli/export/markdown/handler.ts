import { generateMarkdown } from '@likec4/generators'
import { fromWorkspace } from '@likec4/language-services/node'
import { mkdir, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { type ViteLogger, createLikeC4Logger, startTimer } from '../../../logger'
import { LikeC4Model } from '../../../model'
import { path, project, useDotBin } from '../../options'

const ERR_PROJECT_NOT_FOUND = 'project not found'
const ERR_NO_PROJECTS = 'No projects found'

export type MarkdownExportArgs = {
  path: string
  output: string
  project: string | undefined
  useDot: boolean
}

export async function runExportMarkdown(args: MarkdownExportArgs, logger: ViteLogger): Promise<void> {
  const timer = startTimer(logger)
  await using languageServices = await fromWorkspace(args.path, {
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
  } else if (!hasAtLeast(projects, 1)) {
    logger.error(ERR_NO_PROJECTS)
    throw new Error(ERR_NO_PROJECTS)
  } else {
    logger.info(`${k.dim('workspace:')} Found ${projects.length} projects`)
  }

  await mkdir(args.output, { recursive: true })

  let written = 0
  for (const id of projects) {
    const model = await languageServices.layoutedModel(id)
    if (model === LikeC4Model.EMPTY) {
      logger.warn(k.yellow(`Project ${id} is empty, skipping`))
      continue
    }
    const outfile = resolve(args.output, `${id}.md`)
    await writeFile(outfile, generateMarkdown(model))
    written++
    const tolog = outfile.startsWith(args.path) ? relative(args.path, outfile) : outfile
    logger.info(`${k.dim('generated')} ${tolog}`)
  }

  if (written === 0) {
    throw new Error('No documents generated; all projects are empty or were skipped')
  }
  timer.stopAndLog(`✓ export in `)
}

export function markdownCmd(yargs: Argv) {
  return yargs.command({
    command: 'markdown [path]',
    describe: 'export project(s) to Markdown',
    builder: yargs =>
      yargs
        .positional('path', path)
        .option('output', {
          alias: 'o',
          type: 'string',
          desc: '<dir> output directory (default: workspace)',
          normalize: true,
          coerce: resolve,
        })
        .options({
          project,
          'use-dot': useDotBin,
        })
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export markdown')}
    ${k.gray('Render every project to <project>.md in the workspace')}

  ${k.green('$0 export markdown -o ./docs -p my-project src/likec4')}
    ${k.gray('Render one project from src/likec4 to ./docs/my-project.md')}
`),
    handler: async args => {
      const logger = createLikeC4Logger('c4:export')
      await runExportMarkdown(
        {
          path: args.path,
          output: args.output ?? args.path,
          project: args.project,
          useDot: !!args['use-dot'],
        },
        logger,
      )
    },
  })
}
