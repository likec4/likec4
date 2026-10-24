import type { RemovalImpactReport } from '@likec4/language-server'
import { fromWorkspace } from '@likec4/language-services/node'
import { entries } from 'remeda'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { createLikeC4Logger } from '../../logger'
import { displayLocation, findProject, projectsToSearch, reportEditResult } from '../model-edits'
import { path, project } from '../options'

const resolutionTitles = {
  removed: 'Removed together with the element',
  optional: 'Removed only with --scoped-views or --dynamic-steps',
  manual: 'Fix manually',
} as const

function describeReport(report: RemovalImpactReport): string[] {
  const { impact, references } = report
  const lines = [
    `${
      k.bold('Removes')
    } ${impact.elements.length} element(s), ${impact.relations.length} relation(s), ${impact.deployedInstances.length} deployed instance(s)`,
    `${k.bold('Changes')} ${impact.affectedViews.length} view(s)${
      impact.scopedViews.length > 0 ? `, ${impact.scopedViews.length} view(s) are scoped to it` : ''
    }`,
  ]
  if (impact.orphans.length > 0) {
    lines.push(`${k.yellow('Orphans')} (use --orphans to remove): ${impact.orphans.join(', ')}`)
  }
  if (impact.emptyDeploymentNodes.length > 0) {
    lines.push(`${k.yellow('Empty deployment nodes')}: ${impact.emptyDeploymentNodes.join(', ')}`)
  }
  for (const [resolution, title] of entries(resolutionTitles)) {
    const group = references.filter(r => r.resolution === resolution)
    if (group.length === 0) {
      continue
    }
    lines.push(`${k.bold(title)} (${group.length}):`)
    for (const reference of group) {
      lines.push(`  ${k.dim(displayLocation(reference.location.uri, reference.location.range))} ${reference.text}`)
    }
  }
  return lines
}

const safeDeleteCmd = (yargs: yargs.Argv) => {
  return yargs.command({
    command: 'safe-delete <element> [path]',
    describe: 'Remove an element and everything that references it (use --dry-run to see the impact)',
    builder: yargs =>
      yargs
        .positional('element', { type: 'string', demandOption: true, desc: 'element FQN, e.g. cloud.backend' })
        .positional('path', path)
        .options({
          'project': project,
          'dry-run': { type: 'boolean', default: false, desc: 'only report what the removal takes with it' },
          'orphans': { type: 'boolean', default: false, desc: 'also remove elements left without relationships' },
          'scoped-views': { type: 'boolean', default: false, desc: 'also remove views scoped to removed elements' },
          'dynamic-steps': { type: 'boolean', default: false, desc: 'also remove dynamic view steps' },
          'json': { type: 'boolean', default: false, desc: 'print the dry-run report as JSON' },
        }),
    handler: async args => {
      const logger = createLikeC4Logger('c4:safe-delete')
      await using likec4 = await fromWorkspace(args.path, {
        watch: false,
        // Logs go to stderr, so stdout has only the JSON
        ...(args.json && { printErrors: false, configureLogger: 'stderr' as const }),
      })
      const found = await findProject(
        projectsToSearch(likec4, args.project),
        `Element ${args.element}`,
        async projectId => !!(await likec4.parsedModel(projectId)).findElement(args.element),
      )
      if ('error' in found) {
        logger.error(found.error)
        process.exitCode = 1
        return
      }
      const { projectId } = found

      if (args.dryRun) {
        const report = await likec4.removalImpact.analyze([args.element], projectId)
        if (!report) {
          logger.error(`Element not found: ${args.element}`)
          process.exitCode = 1
          return
        }
        if (args.json) {
          process.stdout.write(JSON.stringify(report, null, 2) + '\n')
          return
        }
        for (const line of describeReport(report)) {
          logger.info(line)
        }
        return
      }

      const result = await likec4.modelEdits.apply({
        type: 'safe-delete',
        targets: [args.element],
        options: {
          includeOrphans: args.orphans,
          includeScopedViews: args.scopedViews,
          includeDynamicSteps: args.dynamicSteps,
        },
      }, { projectId })
      reportEditResult(logger, `Safe delete ${args.element}`, result)
    },
  })
}

export default safeDeleteCmd
