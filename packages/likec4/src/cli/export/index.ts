import { invariant } from '@likec4/core'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { ensureReact } from '../ensure-react'
import { path, useDotBin } from '../options'
import { handler as jsonHandler } from './json/handler'
import { pngHandler } from './png/handler'

const exportCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
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
                .options({
                  'output': {
                    alias: ['o', 'outdir'],
                    type: 'string',
                    desc: 'output directory, if not specified, images are saved next to sources',
                    normalize: true,
                    nargs: 1,
                    coerce: resolve,
                  },
                  'theme': {
                    choices: ['light', 'dark'] as const,
                    desc: 'color-scheme to use, defaults to light',
                    conflicts: ['dark', 'light'],
                    nargs: 1,
                  },
                  'dark': {
                    type: 'boolean',
                    desc: 'use dark theme, shortcut for --theme=dark',
                    conflicts: ['theme', 'light'],
                  },
                  'light': {
                    type: 'boolean',
                    desc: 'use light theme, shortcut for --theme=light',
                    conflicts: ['theme', 'dark'],
                  },
                  'use-dot': useDotBin,
                  'seq': {
                    boolean: true,
                    alias: ['sequence'],
                    type: 'boolean',
                    desc: 'use sequence layout for dynamic views',
                  },
                  'flat': {
                    alias: ['flatten'],
                    boolean: true,
                    type: 'boolean',
                    desc: 'flatten all images in output directory ignoring sources structure',
                  },
                  'filter': {
                    alias: 'f',
                    array: true,
                    string: true,
                    desc: 'include views with ids matching given patterns\nmultiple patterns are combined with OR',
                  },
                  'ignore': {
                    boolean: true,
                    alias: 'i',
                    desc: 'continue if export fails for some views',
                  },
                  timeout: {
                    type: 'number',
                    alias: 't',
                    desc: 'timeout for playwright (in seconds)',
                    default: 15,
                    nargs: 1,
                  },
                  'max-attempts': {
                    type: 'number',
                    desc: 'max attempts to export failing view, 1 means no retry',
                    default: 3,
                    nargs: 1,
                  },
                  'server-url': {
                    type: 'string',
                    desc: 'use this url instead of starting new likec4 server',
                    nargs: 1,
                  },
                  'chromium-sandbox': {
                    boolean: true,
                    desc: 'enable chromium sandbox (see Playwright docs)',
                    default: false,
                  },
                })
                .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export png')}
    ${k.gray('Search for likec4 files in current directory and output PNG next to sources')}

  ${k.green('$0 export png --theme dark -o ./png src/likec4')}
    ${k.gray('Search for likec4 files in src/likec4 and output PNG with dark theme to png folder')}

  ${k.green('$0 export png -f "team1*" -f "team2*" --flat -o ./png src/likec4')}
    ${k.gray('Export views matching team1* or team2* only')}

  ${k.green('$0 export png -f "use-case*" --sequence src/likec4')}
    ${k.gray('Export views matching use-case* using sequence layout')}
`),
            handler: async args => {
              // args.
              invariant(args.timeout >= 1, 'timeout must be >= 1')
              invariant(args['max-attempts'] >= 1, 'max-attempts must be >= 1')
              await ensureReact()
              const theme = args.theme ?? (args.dark ? 'dark' : 'light')
              await pngHandler({
                path: args.path,
                useDotBin: args['use-dot'],
                output: args.output,
                timeoutMs: args.timeout * 1000,
                maxAttempts: args.maxAttempts,
                ignore: args.ignore === true,
                outputType: args.flat ? 'flat' : 'relative',
                serverUrl: args.serverUrl,
                theme,
                filter: args.filter,
                sequence: args.seq,
                chromiumSandbox: args['chromium-sandbox'],
              })
            },
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
                  coerce: resolve,
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
                outfile: args.outfile,
              })
            },
          })
          .updateStrings({
            'Commands:': k.bold('Formats:'),
          }),
      handler: () => void 0,
    })
}

export default exportCmd
