import { resolve } from 'path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'
import { outdir, useDotBin } from '../options'

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
      .positional('path', {
        type: 'string',
        desc: 'directory with LikeC4 source files',
        normalize: true
      })
      .coerce(['path'], resolve)
      .default('path', resolve('.'), '.')
      // ----------------------
      // npm package command
      .command(
        ['package [path]', 'pkg', 'npm'],
        'generate npm package',
        yargs =>
          yargs
            // .usage(`${k.bold('Usage:')} $0 codegen react --output <file> [path]`)
            .options({
              useDotBin,
              outdir,
              pkgName: {
                type: 'string',
                desc: 'package name',
                normalize: true
              }
            }),
        async args => {
          const { handler } = await import('./npm-package/handler')
          await handler({
            useDotBin: args.useDotBin,
            path: args.path,
            pkgName: args.pkgName,
            pkgOutDir: args.outdir
          })
        }
      )
      // ----------------------
      // react command
      .command(
        'react-next [path]',
        'generate react (.tsx)',
        yargs =>
          yargs
            .options({
              outdir,
              useDotBin
            })
            .coerce(['outdir'], resolve),
        async args => {
          const { handler } = await import('./react-next')
          await handler({
            useDotBin: args.useDotBin,
            path: args.path,
            outdir: args.outdir
          })
        }
      )
      // ----------------------
      // react command
      .command(
        'react [path]',
        'generate react (.tsx)',
        yargs =>
          yargs
            // .usage(`${k.bold('Usage:')} $0 codegen react --output <file> [path]`)
            .options({
              outfile: {
                alias: 'o',
                type: 'string',
                desc: '<file> output .tsx file',
                normalize: true
              },
              useDotBin
            })
            .coerce(['outfile'], resolve),
        async args => {
          const { handler } = await import('./handler')
          await handler({
            format: 'react',
            useDotBin: args.useDotBin,
            path: args.path,
            outfile: args.outfile
          })
        }
      )
      // ----------------------
      // views-data command
      .command({
        command: 'views-data [path]',
        aliases: ['ts', 'views'],
        describe: 'generate likec4 views data (.ts)',
        builder: yargs =>
          yargs
            .options({
              outfile: {
                alias: 'o',
                type: 'string',
                desc: '<file> output .ts file',
                normalize: true
              },
              useDotBin
            })
            .coerce(['outfile'], resolve),
        handler: async args => {
          const { handler } = await import('./handler')
          await handler({
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
            .options({
              outdir,
              useDotBin
            })
            .coerce(['outdir'], resolve),
        handler: async args => {
          const { handler } = await import('./handler')
          await handler({
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
            .options({
              outdir,
              useDotBin
            })
            .coerce(['outdir'], resolve),
        handler: async args => {
          const { handler } = await import('./handler')
          await handler({
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
            .options({
              outdir,
              useDotBin
            })
            .coerce(['outdir'], resolve),
        handler: async args => {
          const { handler } = await import('./handler')
          await handler({
            format: 'mermaid',
            useDotBin: args.useDotBin,
            path: args.path,
            outdir: args.outdir
          })
        }
      }).epilog(`${k.bold('Examples:')}
  likec4 gen react -o dist/likec4.generated.tsx ./src/likec4
  likec4 gen react -o dist/likec4.generated.tsx ./src/likec4
  likec4 gen views-data -o ./src/likec4-data.ts
  likec4 gen ts --outfile ../likec4.ts
  likec4 gen mmd --outdir assets/
  likec4 gen dot -o out .
`),
  handler: () => void 0
} satisfies CommandModule

export default codegenCmd
