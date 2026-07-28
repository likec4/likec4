import { generateMarkdown } from '@likec4/generators'
import { fromWorkspace } from '@likec4/language-services/node'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { type ViteLogger, createLikeC4Logger, startTimer } from '../../../logger'
import { type UnknownLayouted, LikeC4Model } from '../../../model'
import { path, project, useDotBin } from '../../options'

const ERR_PROJECT_NOT_FOUND = 'project not found'

export type MarkdownExportArgs = {
  path: string
  project: string | undefined
  useDot: boolean
}

function hasAuthoredViews(model: LikeC4Model<UnknownLayouted>): boolean {
  for (const view of model.views()) {
    if (view.$view.sourcePath !== undefined) return true
  }
  return false
}

export async function runExportMarkdown(args: MarkdownExportArgs, logger: ViteLogger): Promise<void> {
  const timer = startTimer(logger)
  await using likec4 = await fromWorkspace(args.path, {
    graphviz: args.useDot ? 'binary' : 'wasm',
    watch: false,
  })

  let projects = [...likec4.languageServices.projects()]
  if (args.project) {
    projects = projects.filter(p => p.id === args.project)
    if (projects.length === 0) {
      logger.error(`${ERR_PROJECT_NOT_FOUND}: ${args.project}`)
      throw new Error(`${ERR_PROJECT_NOT_FOUND}: ${args.project}`)
    }
  } else {
    logger.info(`${k.dim('workspace:')} Found ${projects.length} projects`)
  }

  let written = 0
  for (const prj of projects) {
    const model = await likec4.layoutedModel(prj.id)
    if (model === LikeC4Model.EMPTY || !hasAuthoredViews(model)) {
      logger.warn(k.yellow(`Project ${prj.id} has no views, skipping`))
      continue
    }
    const outfile = join(prj.folder.fsPath, 'README.md')
    await writeFile(outfile, generateMarkdown(model))
    written++
    logger.info(`${k.dim('generated')} ${outfile}`)
  }

  if (written === 0) {
    throw new Error('No documents generated; all projects have no views')
  }
  timer.stopAndLog(`✓ export in `)
}

export function markdownCmd(yargs: Argv) {
  return yargs.command({
    command: 'markdown [path]',
    describe: 'export project(s) to README.md in each project folder',
    builder: yargs =>
      yargs
        .positional('path', path)
        .options({
          project,
          'use-dot': useDotBin,
        })
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export markdown')}
    ${k.gray('Render every project to README.md in its own project folder')}

  ${k.green('$0 export markdown -p my-project src/likec4')}
    ${k.gray('Render only my-project to its README.md under src/likec4')}
`),
    handler: async args => {
      const logger = createLikeC4Logger('c4:export')
      await runExportMarkdown(
        {
          path: args.path,
          project: args.project,
          useDot: !!args['use-dot'],
        },
        logger,
      )
    },
  })
}
