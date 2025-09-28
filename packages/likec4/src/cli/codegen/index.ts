import { resolve } from 'path'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { outdir, path, project, useCorePackage, useDotBin, webcomponentPrefix } from '../options'
import { customHandler } from './custom'
import { legacyHandler } from './handler'
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
                  alias: 'o',
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
                  alias: 'o',
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
                  alias: 'o',
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
                  alias: 'o',
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
