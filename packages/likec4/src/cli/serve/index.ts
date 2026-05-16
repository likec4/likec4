// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type * as yargs from 'yargs'
import { ensureReact } from '../ensure-libs'
import {
  aiEndpoint,
  base,
  hmrPort,
  listen,
  path,
  port,
  title,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
} from '../options'
import { handler } from './serve'

const serveCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'start [path]',
      aliases: ['serve', 'dev'],
      describe: 'Start local dev server to preview LikeC4 views',
      builder: yargs =>
        yargs
          .positional('path', path)
          .option('base', base)
          .option('webcomponent-prefix', webcomponentPrefix)
          .option('title', title)
          .option('ai-endpoint', aiEndpoint)
          .option('use-hash-history', useHashHistory)
          .option('use-dot', useDotBin)
          .option('listen', listen)
          .option('port', port)
          .option('hmr-port', hmrPort)
          .options({
            'react-hmr': {
              type: 'boolean',
              default: true,
              describe: 'Enable/Disable React HMR',
            },
            'build-webcomponent': {
              type: 'boolean',
              default: true,
              describe: 'Enable/Disable Webcomponent build',
            },
          }),
      handler: async args => {
        await ensureReact()
        await handler({
          path: args.path,
          useDotBin: args['use-dot'],
          base: args.base,
          webcomponentPrefix: args['webcomponent-prefix'],
          title: args['title'],
          aiEndpoint: args['ai-endpoint'],
          useHashHistory: args['use-hash-history'],
          listen: args['listen'],
          port: args['port'],
          hmrPort: args['hmr-port'],
          enableHMR: args['react-hmr'],
          enableWebcomponent: args['build-webcomponent'],
        })
      },
    })
}

export default serveCmd
