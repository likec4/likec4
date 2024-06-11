import { resolve } from 'path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'
import { outdir, path, useDotBin, webcomponentPrefix } from '../options'
import { reactLegacyHandler } from './handler'
// import { handler as npmHandler } from './npm-package/handler'
// import { reactNexthandler } from './react-next'
import { reactHandler } from './react'
import { webcomponentHandler } from './webcomponent/handler'

export const codegenCmd = {
  command: 'codegen <command> [path]',
  aliases: ['generate', 'gen'],
  describe: 'Generate various artifacts from LikeC4 sources',
  builder: yargs =>
    // .example(
    //   `${k.green('$0 codegen ts -o views.ts .')}`,
    //   k.gray('Same as codegen views-data')
    // )
    yargs
      // .usage(`${k.bold('Usage:')} $0 codegen <output> [path]`)
      .positional('path', path)
      // ----------------------
      // npm package command
      // .command(
      //   ['package [path]', 'pkg', 'npm'],
      //   '!!experimental!! generate npm package',
      //   yargs =>
      //     yargs
      //       // .usage(`${k.bold('Usage:')} $0 codegen react --output <file> [path]`)
      //       .options({
      //         useDotBin,
      //         outdir,
      //         pkgName: {
      //           type: 'string',
      //           desc: 'package name',
      //           normalize: true
      //         }
      //       }),
      //   async args => {
      //     await npmHandler({
      //       useDotBin: args.useDotBin,
      //       path: args.path,
      //       pkgName: args.pkgName,
      //       pkgOutDir: args.outdir
      //     })
      //   }
      // )
      // ----------------------
      // react-next command
      .command(
        'react [path]',
        'generate react component to embed likec4 views',
        yargs =>
          yargs
            .option('outfile', {
              alias: 'o',
              type: 'string',
              desc: '<file> path to output file (.jsx, .mjs or .js)',
              normalize: true,
              coerce: resolve
            })
            .option('use-dot', useDotBin),
        async args => {
          await reactHandler({
            useDotBin: args.useDotBin,
            path: args.path,
            outfile: args.outfile
          })
        }
      )
      // ----------------------
      // webcomponent command
      .command({
        command: 'webcomponent [path]',
        aliases: ['wc', 'webcomp'],
        describe: 'generate js with webcomponents',
        builder: yargs =>
          yargs
            .option('outfile', {
              alias: 'o',
              type: 'string',
              desc: '<file> output .js file',
              normalize: true,
              coerce: resolve
            })
            .option('webcomponent-prefix', webcomponentPrefix)
            .option('use-dot', useDotBin),
        handler: async args => {
          await webcomponentHandler({
            useDotBin: args.useDotBin,
            path: args.path,
            outfile: args.outfile,
            webcomponentPrefix: args.webcomponentPrefix
          })
        }
      })
      // ----------------------
      // react command
      .command({
        command: 'react-legacy [path]',
        describe: 'generate legacy react components (.tsx)',
        builder: yargs =>
          yargs
            .option('outfile', {
              alias: 'o',
              type: 'string',
              desc: '<file> output .tsx file',
              normalize: true,
              coerce: resolve
            })
            .option('use-dot', useDotBin),
        handler: async args => {
          await reactLegacyHandler({
            format: 'react',
            useDotBin: args.useDotBin,
            path: args.path,
            outfile: args.outfile
          })
        }
      })
      // ----------------------
      // views-data command
      .command({
        command: 'views-data [path]',
        aliases: ['ts', 'views'],
        describe: 'generate likec4 views data (.ts)',
        builder: yargs =>
          yargs
            .option('outfile', {
              alias: 'o',
              type: 'string',
              desc: '<file> output .ts file',
              normalize: true,
              coerce: resolve
            })
            .option('use-dot', useDotBin),
        handler: async args => {
          await reactLegacyHandler({
            format: 'views',
            path: args.path,
            useDotBin: args.useDotBin,
            outfile: args.outfile
          })
        }
      })
      // ----------------------
      // dot command
      .command({
        command: 'dot [path]',
        describe: 'generate graphviz files (.dot)',
        builder: yargs =>
          yargs
            .option('outdir', outdir)
            .option('use-dot', useDotBin),
        handler: async args => {
          await reactLegacyHandler({
            format: 'dot',
            path: args.path,
            useDotBin: args.useDotBin,
            outdir: args.outdir
          })
        }
      })
      // ----------------------
      // d2 command
      .command({
        command: 'd2 [path]',
        describe: 'generate D2 files (.d2)',
        builder: yargs =>
          yargs
            .option('outdir', outdir)
            .option('use-dot', useDotBin),
        handler: async args => {
          await reactLegacyHandler({
            format: 'd2',
            path: args.path,
            useDotBin: args.useDotBin,
            outdir: args.outdir
          })
        }
      })
      // ----------------------
      // mermaid command
      .command({
        command: 'mermaid [path]',
        aliases: ['mmd'],
        describe: 'generate Mermaid files (.mmd)',
        builder: yargs =>
          yargs
            .option('outdir', outdir)
            .option('use-dot', useDotBin),
        handler: async args => {
          await reactLegacyHandler({
            format: 'mermaid',
            useDotBin: args.useDotBin,
            path: args.path,
            outdir: args.outdir
          })
        }
      }).epilog(`${k.bold('Examples:')}
  likec4 gen react -o dist/likec4-views.mjs ./src/likec4
  likec4 gen webcomponent -o likec4.js --webcomponent-prefix c4 --use-dot-bin ./src
  likec4 gen views-data -o ./src/likec4-data.ts
  likec4 gen ts --outfile ../likec4.ts
  likec4 gen mmd --outdir assets/
  likec4 gen dot -o out .
`),
  handler: () => void 0
} satisfies CommandModule

export default codegenCmd
