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
import { resolveAppConfig } from '../../app-config'
import { createLikeC4Logger } from '../../logger'
import { relativeToCwd } from '../../vite/utils'
import { viteBuild } from '../../vite/vite-build'
import { notifyAvailableUpdate } from '../check-update/utils'
import { ensureReact } from '../ensure-libs'
import {
  appConfig,
  base,
  customization,
  outputSingleFile,
  path,
  publicDir,
  theme,
  title,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
  withoutDefault,
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
          .positional('path', withoutDefault(path))
          .option('app-config', appConfig)
          .option('output', {
            alias: 'o',
            type: 'string',
            desc: 'output directory for production build',
            normalize: true,
            coerce: resolve,
          })
          .option('base', base)
          .option('use-hash-history', useHashHistory)
          .option('use-dot', withoutDefault(useDotBin))
          .option('webcomponent-prefix', withoutDefault(webcomponentPrefix))
          .option('build-webcomponent', {
            type: 'boolean',
            defaultDescription: 'true',
            describe: 'enable/disable webcomponent build',
          })
          .option('title', withoutDefault(title))
          .option('customization', customization)
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
        await notifyAvailableUpdate()
        await ensureReact()

        const logger = createLikeC4Logger('c4:build')

        const config = await resolveAppConfig({
          appConfig: args['app-config'],
          path: args.path,
          useDot: args['use-dot'],
          base: args.base,
          title: args.title,
          theme: args.theme,
          useHashHistory: args['use-hash-history'],
          webcomponentPrefix: args['webcomponent-prefix'],
          customization: args.customization,
          publicDir: args.public,
          output: args.output,
          outputSingleFile: args['output-single-file'],
          buildWebcomponent: args['build-webcomponent'],
        })
        if (config.configFile) {
          logger.info(`${k.cyan('app config')} ${k.dim(relativeToCwd(config.configFile))}`)
        }

        await using languageServices = await fromWorkspace(config.workspace, {
          graphviz: config.graphviz,
          watch: false,
        })

        const outputDir = config.build.outDir ?? resolve(languageServices.workspace, 'dist')
        let likec4AssetsDir = resolve(outputDir, 'assets')

        await viteBuild({
          base: config.base,
          useHashHistory: config.build.singleFile || config.useHashHistory,
          customLogger: logger,
          webcomponentPrefix: config.webcomponentPrefix,
          buildWebcomponent: config.build.webcomponent,
          title: config.title,
          theme: config.theme,
          customization: config.customization,
          languageServices,
          likec4AssetsDir,
          outputDir,
          outputSingleFile: config.build.singleFile,
          userPublicDir: config.publicDir,
        })

        showSupportUsMessage()
      },
    })
}
export default buildCmd
