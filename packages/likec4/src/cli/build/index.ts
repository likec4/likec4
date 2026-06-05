// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { fromWorkspace } from '@likec4/language-services/node'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { createLikeC4Logger } from '../../logger'
import { viteBuild } from '../../vite/vite-build'
import { notifyAvailableUpdate } from '../check-update/utils'
import { ensureReact } from '../ensure-libs'
import {
  base,
  outputSingleFile,
  path,
  publicDir,
  theme,
  title,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
} from '../options'
import { showSupportUsMessage } from '../support-message'

const buildCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'build [path]',
      aliases: ['bundle'],
      describe: 'Build a static website',
      builder: yargs =>
        yargs
          .positional('path', path)
          .option('output', {
            alias: 'o',
            type: 'string',
            desc: 'output directory for production build',
            normalize: true,
            coerce: resolve,
          })
          .option('base', base)
          .option('use-hash-history', useHashHistory)
          .option('use-dot', useDotBin)
          .option('webcomponent-prefix', webcomponentPrefix)
          .option('build-webcomponent', {
            type: 'boolean',
            default: true,
            describe: 'enable/disable webcomponent build',
          })
          .option('title', title)
          .option('output-single-file', outputSingleFile)
          .option('public', publicDir)
          .option('theme', theme)
          .example(
            `${k.green('$0 build -o ./build ./src')}`,
            k.gray('Search for likec4 files in \'src\' and output static site to \'build\''),
          )
          .example(
            `${k.green('$0 build --theme dark -o ./build ./src')}`,
            k.gray('Build with dark color scheme as default'),
          )
          .example(
            `${k.green('$0 build --public ./assets -o ./build ./src')}`,
            k.gray('Copy files from \'assets\' to the output directory as-is'),
          ),
      handler: async (args) => {
        const params = {
          useHashHistory: args['use-hash-history'] ?? false,
          useDotBin: args['use-dot'],
          webcomponentPrefix: args['webcomponent-prefix'],
          buildWebcomponent: args['build-webcomponent'],
          outputSingleFile: args['output-single-file'] ?? false,
        }
        await notifyAvailableUpdate()
        await ensureReact()

        const logger = createLikeC4Logger('c4:build')

        await using languageServices = await fromWorkspace(args.path, {
          graphviz: args['use-dot'] ? 'binary' : 'wasm',
          watch: false,
        })

        const outputDir = args.output ?? resolve(languageServices.workspace, 'dist')
        let likec4AssetsDir = resolve(outputDir, 'assets')

        await viteBuild({
          base: args.base,
          useHashHistory: params.outputSingleFile || params.useHashHistory,
          customLogger: logger,
          webcomponentPrefix: params.webcomponentPrefix,
          buildWebcomponent: params.buildWebcomponent,
          title: args.title,
          theme: args.theme,
          languageServices,
          likec4AssetsDir,
          outputDir,
          outputSingleFile: params.outputSingleFile,
          userPublicDir: args.public,
        })

        showSupportUsMessage()
      },
    })
}
export default buildCmd
