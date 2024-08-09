import { invariant } from '@likec4/core'
import { resolve } from 'node:path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'
import { path, useDotBin } from '../options'
import { handler as jsonHandler } from './json/handler'
import { pngHandler } from './png/handler'

export const exportCmd = {
  command: 'export <format> [path]',
  describe: 'Export to images or JSON',
  builder: yargs =>
    yargs
      .usage(`${k.bold('Usage:')} $0 export <format> [path]`)
      .positional('path', path)
      // ----------------------
      // PNG command
      .command({
        command: 'png [path]',
        describe: 'export views to PNG',
        builder: yargs =>
          yargs
            .option('output', {
              alias: 'o',
              type: 'string',
              desc: 'output directory',
              normalize: true,
              coerce: resolve
            })
            .option('theme', {
              choices: ['light', 'dark'] as const,
              desc: 'color-scheme to use, default is light'
            })
            .option('use-dot', useDotBin)
            .options({
              'ignore': {
                boolean: true,
                alias: 'i',
                desc: 'continue if some views failed to export',
                default: false
              },
              timeout: {
                type: 'number',
                alias: 't',
                desc: '(sec) timeout for playwright ',
                default: 10
              },
              'max-attempts': {
                type: 'number',
                describe: '',
                desc: '(number) if export failed, retry N times',
                default: 3
              }
            })
            .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export png')}
    ${k.gray('Search for likec4 files in current directory and output PNG next to sources')}

  ${k.green('$0 export png --theme dark -o ./png src/likec4 ')}
    ${k.gray('Search for likec4 files in src/likec4 and output PNG with dark theme to png folder')}
`),
        handler: async args => {
          // args.
          invariant(args.timeout >= 1, 'timeout must be >= 1')
          invariant(args['max-attempts'] >= 1, 'max-attempts must be >= 1')
          await pngHandler({
            path: args.path,
            useDotBin: args.useDotBin,
            output: args.output,
            timeoutMs: args.timeout * 1000,
            maxAttempts: args.maxAttempts,
            ignore: args.ignore,
            theme: args.theme ?? 'light'
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
            .option('outfile', {
              alias: 'o',
              type: 'string',
              desc: '<file> output .json file',
              default: 'likec4.json',
              normalize: true,
              coerce: resolve
            })
            .option('use-dot', useDotBin)
            .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export json')}
    ${k.gray('Search for likec4 files in current directory and output JSON to likec4.json')}

  ${k.green('$0 export json -o ./generated/likec4.json src/likec4 ')}
    ${k.gray('Search for likec4 files in src/likec4 and output JSON to generated/likec4.json')}
`),
        handler: async args => {
          await jsonHandler({
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
