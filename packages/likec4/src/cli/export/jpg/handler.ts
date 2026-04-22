import { invariant } from '@likec4/core'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { createLikeC4Logger } from '../../../logger'
import { ensurePlaywright, ensureReact } from '../../ensure-libs'
import { path, project, useDotBin } from '../../options'
import { showSupportUsMessage } from '../../support-message'
import { type PngExportArgs, runExportPng } from '../png/handler'

/** CLI entry: create logger and delegate to runExportPng with format=jpeg. */
export async function jpgHandler(args: PngExportArgs): Promise<void> {
  const logger = createLikeC4Logger('c4:export')
  await runExportPng({ ...args, format: 'jpeg' }, logger)
}

const DEFAULT_JPEG_QUALITY = 80

/** Registers the `export jpg` subcommand with yargs. */
export function jpgCmd(yargs: Argv) {
  return yargs.command({
    command: 'jpg [path]',
    describe: 'export views to JPEG',
    builder: yargs =>
      yargs
        .positional('path', path)
        .options({
          'outdir': {
            alias: ['o', 'output'],
            type: 'string',
            desc: 'output directory for JPEG files; if not specified, images are saved next to sources',
            normalize: true,
            nargs: 1,
            coerce: resolve,
          },
          project,
          'quality': {
            alias: 'q',
            type: 'number',
            desc: 'JPEG quality (1-100)',
            default: DEFAULT_JPEG_QUALITY,
            nargs: 1,
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
            alias: ['sequence'],
            type: 'boolean',
            desc: 'use sequence layout for dynamic views',
          },
          'flat': {
            alias: ['flatten'],
            type: 'boolean',
            desc: 'flatten all images in outdir ignoring sources structure',
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
  ${k.green('$0 export jpg')}
    ${k.gray('Search for likec4 files in current directory and output JPEG next to sources')}

  ${k.green('$0 export jpg --theme dark -o ./jpg src/likec4')}
    ${k.gray('Search for likec4 files in src/likec4 and output JPEG with dark theme to jpg folder')}

  ${k.green('$0 export jpg --quality 90 -o ./jpg src/likec4')}
    ${k.gray('Export JPEG with 90% quality')}

  ${k.green('$0 export jpg -f "team1*" -f "team2*" --flat -o ./jpg src/likec4')}
    ${k.gray('Export views matching team1* or team2* only')}
`),
    handler: async args => {
      invariant(args.quality >= 1 && args.quality <= 100, 'quality must be between 1 and 100')
      invariant(args.timeout >= 1, 'timeout must be >= 1')
      invariant(args['max-attempts'] >= 1, 'max-attempts must be >= 1')
      await ensureReact()
      await ensurePlaywright()
      const theme = args.theme ?? (args.dark ? 'dark' : 'light')
      await jpgHandler(
        {
          path: args.path,
          useDotBin: args['use-dot'],
          output: args.outdir,
          project: args.project,
          timeoutMs: args.timeout * 1000,
          maxAttempts: args['max-attempts'],
          ignore: args.ignore === true,
          outputType: args.flat ? 'flat' : 'relative',
          serverUrl: args['server-url'],
          theme,
          filter: args.filter,
          sequence: args.seq,
          chromiumSandbox: args['chromium-sandbox'],
          format: 'jpeg',
          quality: args.quality,
        } satisfies PngExportArgs,
      )
      showSupportUsMessage()
    },
  })
}
