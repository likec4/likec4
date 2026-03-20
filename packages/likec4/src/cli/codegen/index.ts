import { resolve } from 'path'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { outdir, path, project, useCorePackage, useDotBin, webcomponentPrefix } from '../options'
import { showSupportUsMessage } from '../support-message'
import { customHandler } from './custom'
import { legacyHandler } from './handler'
import { leanixDryRunHandler } from './leanix-dry-run'
import { leanixInventorySnapshotHandler } from './leanix-inventory-snapshot'
import { leanixReconcileHandler } from './leanix-reconcile'
import { modelHandler } from './model'
import { reactHandler } from './react'
import { webcomponentHandler } from './webcomponent/handler'

const codegenCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'gen <command> [path]',
      aliases: ['generate', 'codegen'],
      describe: 'Generate various artifacts from LikeC4 sources',
      builder: yargs =>
        yargs
          .positional('path', path)
          // ----------------------
          // react command
          .command(
            'react [path]',
            'generate react component to render likec4 view',
            yargs =>
              yargs
                .positional('path', path)
                .option('project', project)
                .option('outfile', {
                  alias: ['o', 'output'],
                  type: 'string',
                  desc: '<file> path to output file (.jsx, .mjs or .js)',
                  normalize: true,
                  coerce: resolve,
                })
                .option('use-dot', useDotBin)
                .option('use-core-package', useCorePackage),
            async args => {
              await reactHandler({
                project: args.project,
                useDotBin: args.useDotBin,
                path: args.path,
                outfile: args.outfile,
                useCorePackage: args.useCorePackage,
              })
              showSupportUsMessage()
            },
          )
          // ----------------------
          // webcomponent command
          .command({
            command: 'webcomponent [path]',
            aliases: ['wc', 'webcomp'],
            describe: 'generate js with webcomponents',
            builder: yargs =>
              yargs
                .positional('path', path)
                .option('project', project)
                .option('outfile', {
                  alias: ['o', 'output'],
                  type: 'string',
                  desc: '<file> path to output file (.mjs or .js)',
                  normalize: true,
                  coerce: resolve,
                })
                .option('webcomponent-prefix', webcomponentPrefix)
                .option('use-dot', useDotBin),
            handler: async args => {
              await webcomponentHandler({
                project: args.project,
                useDotBin: args.useDotBin,
                path: args.path,
                outfile: args.outfile,
                webcomponentPrefix: args.webcomponentPrefix,
              })
              showSupportUsMessage()
            },
          })
          // ----------------------
          // model command
          .command({
            command: 'model [path]',
            aliases: ['ts'],
            describe: 'generate LikeC4Model (.ts)',
            builder: yargs =>
              yargs
                .positional('path', path)
                .option('project', project)
                .option('outfile', {
                  alias: ['o', 'output'],
                  type: 'string',
                  desc: '<file> path to output file (.ts)',
                  normalize: true,
                  coerce: resolve,
                })
                .option('use-dot', useDotBin)
                .option('use-core-package', useCorePackage),
            handler: async args => {
              await modelHandler({
                path: args.path,
                useDotBin: args.useDotBin,
                useCorePackage: args.useCorePackage,
                outfile: args.outfile,
                project: args.project,
              })
              showSupportUsMessage()
            },
          })
          // ----------------------
          // views-data command
          .command({
            command: 'views-data [path]',
            aliases: ['views'],
            describe: '{deprecated} use codegen model',
            deprecated: true,
            builder: yargs =>
              yargs
                .positional('path', path)
                .option('outfile', {
                  alias: ['o', 'output'],
                  type: 'string',
                  desc: '<file> output .ts file',
                  normalize: true,
                  coerce: resolve,
                })
                .option('use-dot', useDotBin),
            handler: async args => {
              await legacyHandler({
                format: 'views',
                path: args.path,
                useDotBin: args.useDotBin,
                outfile: args.outfile,
              })
            },
          })
          // ----------------------
          // leanix subcommands: dry-run, inventory, reconcile
          .command({
            command: 'leanix [path]',
            describe: 'LeanIX bridge: dry-run, inventory snapshot, reconcile',
            builder: yargs =>
              yargs
                .positional('path', path)
                .demandCommand(1, 'Choose a subcommand: dry-run, inventory, reconcile')
                .command(
                  'dry-run [path]',
                  'generate LeanIX bridge artifacts (manifest, dry-run inventory, report)',
                  cmd =>
                    cmd
                      .positional('path', path)
                      .option('outdir', {
                        ...outdir,
                        desc: '<dir> output directory for manifest.json, leanix-dry-run.json, report.json',
                      })
                      .option('project', project)
                      .option('use-dot', useDotBin)
                      .example(
                        `${k.green('$0 gen leanix dry-run -o out/bridge')}`,
                        k.gray('Write bridge artifacts to out/bridge'),
                      ),
                  async args => {
                    await leanixDryRunHandler({
                      path: args.path,
                      outdir: args.outdir ?? resolve(process.cwd(), 'out', 'bridge'),
                      project: args.project,
                      useDotBin: args.useDotBin,
                    })
                  },
                )
                .command(
                  'inventory',
                  'fetch LeanIX inventory (read-only) and write leanix-inventory-snapshot.json',
                  cmd =>
                    cmd
                      .option('outdir', {
                        ...outdir,
                        default: resolve(process.cwd(), 'out', 'bridge'),
                        desc: '<dir> output directory for leanix-inventory-snapshot.json',
                      })
                      .option('likec4-id-attribute', {
                        type: 'string',
                        desc: 'custom LeanIX attribute key for likec4Id (e.g. "likec4Id")',
                      })
                      .example(
                        `${k.green('$0 gen leanix inventory -o out/bridge')}`,
                        k.gray('Requires LEANIX_API_TOKEN'),
                      ),
                  async args => {
                    await leanixInventorySnapshotHandler({
                      outdir: args.outdir ?? resolve(process.cwd(), 'out', 'bridge'),
                      ...(args.likec4IdAttribute != null ? { likec4IdAttribute: args.likec4IdAttribute } : {}),
                    })
                  },
                )
                .command(
                  'reconcile [path]',
                  'reconcile manifest with leanix-inventory-snapshot; write reconciliation-report.json',
                  cmd =>
                    cmd
                      .positional('path', path)
                      .option('outdir', {
                        ...outdir,
                        default: resolve(process.cwd(), 'out', 'bridge'),
                        desc: '<dir> directory with manifest.json and leanix-inventory-snapshot.json',
                      })
                      .option('project', project)
                      .option('use-dot', useDotBin)
                      .example(
                        `${k.green('$0 gen leanix reconcile -o out/bridge')}`,
                        k.gray('Reads manifest + snapshot from outdir; optional workspace for name+type matching'),
                      ),
                  async args => {
                    await leanixReconcileHandler({
                      path: args.path,
                      outdir: args.outdir ?? resolve(process.cwd(), 'out', 'bridge'),
                      project: args.project,
                      useDotBin: args.useDotBin,
                    })
                  },
                ),
            handler: async () => {
              // Subcommand required; yargs shows help when no subcommand given
            },
          })
          // ----------------------
          // dot command
          .command({
            command: 'dot [path]',
            describe: 'generate graphviz files (.dot)',
            builder: yargs =>
              yargs
                .positional('path', path)
                .option('outdir', outdir)
                .option('use-dot', useDotBin),
            handler: async args => {
              await legacyHandler({
                format: 'dot',
                path: args.path,
                useDotBin: args.useDotBin,
                outdir: args.outdir,
              })
              showSupportUsMessage()
            },
          })
          // ----------------------
          // d2 command
          .command({
            command: 'd2 [path]',
            describe: 'generate D2 files (.d2)',
            builder: yargs =>
              yargs
                .positional('path', path)
                .option('outdir', outdir)
                .option('use-dot', useDotBin),
            handler: async args => {
              await legacyHandler({
                format: 'd2',
                path: args.path,
                useDotBin: args.useDotBin,
                outdir: args.outdir,
              })
              showSupportUsMessage()
            },
          })
          // ----------------------
          // mermaid command
          .command({
            command: 'mermaid [path]',
            aliases: ['mmd'],
            describe: 'generate Mermaid files (.mmd)',
            builder: yargs =>
              yargs
                .positional('path', path)
                .option('outdir', outdir)
                .option('use-dot', useDotBin),
            handler: async args => {
              await legacyHandler({
                format: 'mermaid',
                useDotBin: args.useDotBin,
                path: args.path,
                outdir: args.outdir,
              })
              showSupportUsMessage()
            },
          })
          // ----------------------
          // puml command
          .command({
            command: 'plantuml [path]',
            aliases: ['puml'],
            describe: 'generate PlantUML files (.puml)',
            builder: yargs =>
              yargs
                .positional('path', path)
                .option('outdir', outdir)
                .option('use-dot', useDotBin),
            handler: async args => {
              await legacyHandler({
                format: 'plantuml',
                useDotBin: args.useDotBin,
                path: args.path,
                outdir: args.outdir,
              })
              showSupportUsMessage()
            },
          })
          .command({
            command: '<custom> [path]',
            describe: 'run custom generator from likec4 config',
            builder: yargs =>
              yargs
                .positional('path', path)
                .option('project', project)
                .option('use-dot', useDotBin),
            handler: async (args) => {
              await customHandler({
                name: 'custom',
                path: args.path,
                project: args.project,
                useDotBin: args.useDotBin,
              })
            },
          })
          .epilog(`${k.bold('Examples:')}
  likec4 gen react -o dist/likec4-views.mjs ./src/likec4
  likec4 gen model -o likec4-model.ts
  likec4 gen leanix dry-run -o out/bridge
  likec4 gen leanix inventory -o out/bridge
  likec4 gen leanix reconcile -o out/bridge
  likec4 gen ts --outfile likec4-model.ts
  likec4 gen webcomponent -o likec4.js --webcomponent-prefix c4 --use-dot ./src
  likec4 gen mmd --outdir assets/
  likec4 gen plantuml --outdir assets/
  likec4 gen dot -o out .
`),
      handler: async (args: any) => {
        await customHandler({
          name: args.command,
          path: args.path,
          project: args.project,
          useDotBin: args.useDotBin,
        })
      },
    })
}

export default codegenCmd
