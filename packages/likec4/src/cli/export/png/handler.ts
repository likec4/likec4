// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { invariant } from '@likec4/core'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { createLikeC4Logger } from '../../../logger'
import { ensurePlaywright, ensureReact } from '../../ensure-libs'
import { appConfig, customization, path, project, useDotBin, withoutDefault } from '../../options'
import {
  type ImageExportArgs,
  concurrencyOption,
  notationPanelOptions,
  resolveImageExportConfig,
  runExport,
} from '../image/runExport'

/** CLI entry: create logger and delegate to runExport (align with drawio/json handlers). */
export async function pngHandler(args: ImageExportArgs): Promise<void> {
  const logger = createLikeC4Logger('c4:export')
  await runExport({ ...args, format: 'png' }, logger)
}

/** Registers the `export png` subcommand with yargs (path, outdir, project, theme, etc.). */
export function pngCmd(yargs: Argv) {
  return yargs.command({
    command: 'png [path]',
    describe: 'export views to PNG',
    builder: yargs =>
      yargs
        .positional('path', withoutDefault(path))
        .options({
          'app-config': appConfig,
          customization,
          'outdir': {
            alias: ['o', 'output'],
            type: 'string',
            desc: 'output directory for PNG files; if not specified, images are saved next to sources',
            normalize: true,
            nargs: 1,
            coerce: resolve,
          },
          project,
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
          'use-dot': withoutDefault(useDotBin),
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
          ...concurrencyOption,
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
          'notation': {
            boolean: true,
            desc: 'include view notation in exported PNG files',
            default: false,
          },
          ...notationPanelOptions,
          'description': {
            boolean: true,
            desc: 'include view description in exported PNG files',
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
      invariant(args.timeout >= 1, 'timeout must be >= 1')
      invariant(args['max-attempts'] >= 1, 'max-attempts must be >= 1')
      invariant(Number.isInteger(args.concurrency) && args.concurrency >= 1, 'concurrency must be a positive integer')
      await ensureReact()
      await ensurePlaywright()
      const theme = args.theme ?? (args.dark ? 'dark' : 'light')
      await pngHandler(
        {
          ...await resolveImageExportConfig(args, createLikeC4Logger('c4:export')),
          output: args.outdir,
          project: args.project,
          timeoutMs: args.timeout * 1000,
          maxAttempts: args['max-attempts'],
          concurrency: args.concurrency,
          ignore: args.ignore === true,
          outputType: args.flat ? 'flat' : 'relative',
          serverUrl: args['server-url'],
          theme,
          filter: args.filter,
          sequence: args.seq,
          chromiumSandbox: args['chromium-sandbox'],
          notation: args.notation,
          notationPosition: args['notation-position'],
          notationText: args['notation-text'],
          description: args.description,
        } satisfies ImageExportArgs,
      )
    },
  })
}
