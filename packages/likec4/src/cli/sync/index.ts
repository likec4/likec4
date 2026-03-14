import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { outdir, path, project, useDotBin } from '../options'
import { runSyncLeanix } from './leanix'

const DEFAULT_OUTDIR = resolve(process.cwd(), 'out', 'bridge')

export default function syncCmd(yargs: Argv) {
  return yargs.command({
    command: 'sync <target> [path]',
    describe: 'Sync bridge artifacts (e.g. LeanIX)',
    builder: yargs =>
      yargs
        .positional('target', {
          type: 'string',
          choices: ['leanix'],
          describe: 'Target system (leanix)',
        })
        .positional('path', path)
        .option('outdir', {
          ...outdir,
          default: DEFAULT_OUTDIR,
          desc: '<dir> output directory for bridge artifacts (manifest, leanix-dry-run, report, sync-plan)',
        })
        .option('dry-run', {
          type: 'boolean',
          default: true,
          describe: 'Only write artifacts and optional sync-plan; do not call LeanIX API for create/update',
        })
        .option('apply', {
          type: 'boolean',
          default: false,
          describe: 'Run live sync to LeanIX (requires LEANIX_API_TOKEN)',
        })
        .option('project', project)
        .option('use-dot', useDotBin)
        .example(
          `${k.green('$0 sync leanix --dry-run -o out/bridge')}`,
          k.gray('Write bridge artifacts and optionally sync-plan when LEANIX_API_TOKEN is set'),
        )
        .example(
          `${k.green('$0 sync leanix --apply -o out/bridge')}`,
          k.gray('Write artifacts then run live sync; updates manifest with LeanIX IDs'),
        ),
    handler: async (args: any) => {
      if (args.target === 'leanix') {
        await runSyncLeanix({
          path: args.path,
          outdir: args.outdir ?? DEFAULT_OUTDIR,
          project: args.project,
          useDotBin: args.useDotBin,
          dryRun: args.dryRun,
          apply: args.apply,
        })
      }
    },
  })
}
