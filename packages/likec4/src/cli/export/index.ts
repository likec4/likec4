import { invariant } from '@likec4/core'
import { resolve } from 'node:path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'
import { useDotBin } from '../options'

export const exportCmd = {
  command: 'export <format> [path]',
  describe: 'Export model to various formats',
  builder: yargs =>
    yargs
      .usage(`${k.bold('Usage:')} $0 export <format> [path]`)
      .positional('path', {
        type: 'string',
        desc: 'directory with LikeC4 source files',
        normalize: true
      })
      .coerce(['path'], resolve)
      .default('path', resolve('.'), '.')
      // ----------------------
      // PNG command
      .command({
        command: 'png [path]',
        describe: 'export views to PNG',
        builder: yargs =>
          yargs
            .options({
              output: {
                alias: 'o',
                type: 'string',
                desc: 'output directory',
                normalize: true
              },
              useDotBin,
              'ignore': {
                boolean: true,
                alias: 'i',
                desc: 'continue if some views failed to export',
                default: false
              },
              timeout: {
                type: 'number',
                alias: 't',
                desc: '(ms) timeout for playwright operations',
                default: 10000
              },
              'max-attempts': {
                type: 'number',
                describe: '',
                desc: '(number) if export failed, retry N times',
                default: 4
              }
            })
            .coerce(['output'], resolve)
            .default('output', resolve('.'), '.')
            .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export png')}
    ${k.gray('Search for likec4 files in current directory and output PNG next to sources')}

  ${k.green('$0 export png -o ./generated src/likec4 ')}
    ${k.gray('Search for likec4 files in src/likec4 and output PNG next to generated')}
`),
        handler: async args => {
          // args.
          const { handler } = await import('./png/handler')
          invariant(args.timeout >= 1000, 'timeout must be >= 1000')
          invariant(args['max-attempts'] >= 1, 'max-attempts must be >= 1')
          await handler({
            path: args.path,
            useDotBin: args.useDotBin,
            output: args.output,
            timeout: args.timeout,
            maxAttempts: args.maxAttempts,
            ignore: args.ignore
          })
        }
      })
      // ----------------------
      // JSON command
      .command({
        command: 'json [path]',
        describe: 'export model to JSON',
        builder: yargs =>
          yargs
            .options({
              outfile: {
                alias: 'o',
                type: 'string',
                desc: '<file> output .json file',
                normalize: true
              },
              useDotBin
            })
            .coerce(['outfile'], resolve)
            .default('outfile', resolve('./likec4.json'), 'likec4.json')
            .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export json')}
    ${k.gray('Search for likec4 files in current directory and output JSON to likec4.json')}

  ${k.green('$0 export json -o ./generated/likec4.json src/likec4 ')}
    ${k.gray('Search for likec4 files in src/likec4 and output JSON to generated/likec4.json')}
`),
        handler: async args => {
          const { handler } = await import('./json/handler')
          await handler({
            path: args.path,
            useDotBin: args.useDotBin,
            outfile: args.outfile
          })
        }
      })
      .updateStrings({
        'Commands:': k.bold('Formats:')
      }),
  handler: () => void 0
} satisfies CommandModule

export default exportCmd
