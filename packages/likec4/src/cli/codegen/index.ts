import { resolve } from 'path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'

export const codegenCmd = {
  command: 'codegen <command> [path]',
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
              }
            })
            .coerce(['outfile'], resolve),
        async args => {
          const { handler } = await import('./handler')
          await handler({
            format: 'react',
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
              }
            })
            .coerce(['outfile'], resolve),
        handler: async args => {
          const { handler } = await import('./handler')
          await handler({
            format: 'views',
            path: args.path,
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
              outdir: {
                alias: 'o',
                type: 'string',
                desc: '<directory> output directory',
                normalize: true
              }
            })
            .coerce(['outdir'], resolve),
        handler: async args => {
          const { handler } = await import('./handler')
          await handler({
            format: 'dot',
            path: args.path,
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
              outdir: {
                alias: 'o',
                type: 'string',
                desc: '<directory> output directory',
                normalize: true
              }
            })
            .coerce(['outdir'], resolve),
        handler: async args => {
          const { handler } = await import('./handler')
          await handler({
            format: 'd2',
            path: args.path,
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
              outdir: {
                alias: 'o',
                type: 'string',
                desc: '<directory> output directory',
                normalize: true
              }
            })
            .coerce(['outdir'], resolve),
        handler: async args => {
          const { handler } = await import('./handler')
          await handler({
            format: 'mermaid',
            path: args.path,
            outdir: args.outdir
          })
        }
      }).epilog(`${k.bold('Examples:')}
  likec4 codegen react -o dist/likec4.generated.tsx ./src/likec4
  likec4 codegen views-data -o ./src/likec4-data.ts
  likec4 codegen ts --outfile ../likec4.ts
  likec4 codegen mmd --outdir assets/
  likec4 codegen dot -o out .
`),
  handler: () => void 0
} satisfies CommandModule

export default codegenCmd
