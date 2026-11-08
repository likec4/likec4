import { type DiffSummary, type ProjectId, DiffId } from '@likec4/core/types'
import type { DiffAction } from '@likec4/language-server'
import { fromWorkspace } from '@likec4/language-services/node'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { createLikeC4Logger } from '../../logger'
import { findProject, printPreview, projectsToSearch, reportEditResult } from '../model-edits'
import { path, project } from '../options'

function describeDiff(diff: DiffSummary & { projectId: ProjectId }, withProject: boolean): string[] {
  const { added, removed, modified } = diff
  return [
    `${withProject ? `${k.dim(`${diff.projectId}:`)} ` : ''}${k.bold(diff.id)}${
      diff.title ? ` ${k.dim(diff.title)}` : ''
    }`,
    `  adds ${added.elements} element(s) and ${added.relations} relation(s), removes ${removed.elements} element(s) and ${removed.relations} relation(s), modifies ${modified.elements} element(s)`,
    `  changes ${diff.views.length} view(s)${diff.views.length > 0 ? `: ${diff.views.map(v => v.id).join(', ')}` : ''}`,
  ]
}

async function applyDiff(
  action: DiffAction,
  args: { path: string; diff: string; project?: string | undefined; dryRun: boolean; acceptOverlaps?: boolean },
) {
  const logger = createLikeC4Logger(`c4:diff:${action}`)
  await using likec4 = await fromWorkspace(args.path, { watch: false })
  if (likec4.hasErrors()) {
    logger.warn('The workspace has errors, the result may need manual fixes')
  }
  const request = {
    type: 'apply-diff',
    diffId: DiffId(args.diff),
    action,
    acceptOverlaps: args.acceptOverlaps,
  } as const
  const found = await findProject(
    projectsToSearch(likec4, args.project),
    `Diff ${args.diff}`,
    async projectId => !!(await likec4.parsedModel(projectId)).$data.diffs?.[request.diffId],
  )
  if ('error' in found) {
    logger.error(found.error)
    process.exitCode = 1
    return
  }
  const { projectId } = found
  if (args.dryRun) {
    const preview = await likec4.modelEdits.preview(request, projectId)
    if ('error' in preview) {
      logger.error(preview.error)
      process.exitCode = 1
      return
    }
    printPreview(preview)
    return
  }
  const result = await likec4.modelEdits.apply(request, { projectId })
  reportEditResult(logger, `${action === 'apply' ? 'Apply' : 'Discard'} diff ${args.diff}`, result)
}

const diffActionArgs = (yargs: yargs.Argv) =>
  yargs
    .positional('diff', { type: 'string', demandOption: true, desc: 'diff name' })
    .positional('path', path)
    .option('project', project)
    .option('dry-run', { type: 'boolean', default: false, desc: 'print the changes without writing files' })

const diffCmd = (yargs: yargs.Argv) => {
  return yargs.command({
    command: 'diff',
    describe: 'List, apply or discard model diffs',
    builder: yargs =>
      yargs
        .command({
          command: 'list [path]',
          describe: 'List model diffs and the views they change',
          builder: yargs =>
            yargs
              .positional('path', path)
              .option('project', project)
              .option('json', { type: 'boolean', default: false, desc: 'print as JSON' }),
          handler: async args => {
            const logger = createLikeC4Logger('c4:diff:list')
            await using likec4 = await fromWorkspace(args.path, {
              watch: false,
              // Logs go to stderr, so stdout has only the JSON
              ...(args.json && { printErrors: false, configureLogger: 'stderr' as const }),
            })
            const projects = projectsToSearch(likec4, args.project)
            const diffs: Array<DiffSummary & { projectId: ProjectId }> = []
            for (const projectId of projects) {
              diffs.push(...(await likec4.modelDiffs.list(projectId)).map(diff => ({ projectId, ...diff })))
            }
            if (args.json) {
              process.stdout.write(JSON.stringify(diffs, null, 2) + '\n')
              return
            }
            if (diffs.length === 0) {
              logger.info('No diffs found')
              return
            }
            for (const line of diffs.flatMap(diff => describeDiff(diff, projects.length > 1))) {
              logger.info(line)
            }
          },
        })
        .command({
          command: 'apply <diff> [path]',
          describe:
            'Apply the diff to the model (removes "remove" entries with their references, merges "add" blocks into the model)',
          builder: yargs =>
            diffActionArgs(yargs).option('accept-overlaps', {
              type: 'boolean',
              default: false,
              desc: 'apply although the diff overlaps with other diffs (their owners agreed)',
            }),
          handler: args => applyDiff('apply', args),
        })
        .command({
          command: 'discard <diff> [path]',
          describe: 'Delete the diff without changing the model',
          builder: diffActionArgs,
          handler: args => applyDiff('discard', args),
        })
        .demandCommand(1, 'Please choose: list, apply or discard'),
    handler: () => {},
  })
}

export default diffCmd
