#!/usr/bin/env -S pnpm tsx

import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import { defineCommand, runMain } from 'citty'
import { resolve } from 'node:path'
import { createServer } from 'vite'

const main = defineCommand({
  meta: {
    name: 'likec4-spa',
    description: 'LikeC4 SPA Development CLI',
  },
  args: {
    workspace: {
      type: 'positional',
      valueHint: 'dir',
      description: 'likec4 source directory',
      required: false,
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      description: 'verbose output',
      default: false,
    },
  },
  async run(context) {
    const workspace = resolve(context.args.workspace || '../../examples/')
    console.info('workspace:', workspace)

    console.info('Loading vite.config.ts...')
    // const defineConfig = await import('./vite.config.ts').then(module => module.default)

    // const config = defineConfig({
    //   command: 'serve',
    //   mode: 'development',
    // })
    // config.plugins = [
    //   LikeC4VitePlugin({
    //     workspace,
    //     logLevel: 'trace',
    //   }),
    //   ...config.plugins!,
    // ]
    context.data ??= {}

    const server = context.data.server = await createServer({
      // configFile: false,
      // inlineConfig: {},
      clearScreen: false,
      mode: 'development',
      configFileDependencies: [
        '@likec4/core',
        '@likec4/language-server',
        '@likec4/language-services',
        '@likec4/vite-plugin',
      ],
      server: {
        fs: {
          strict: false,
        },
        allowedHosts: true,
      },
      plugins: [
        LikeC4VitePlugin({
          workspace,
          logLevel: context.args.verbose ? 'trace' : 'debug',
        }),
      ],
      // ...config,
    })
    await server.listen()
    server.printUrls()

    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        resolve()
      })
    })
  },
  async cleanup(context) {
    console.info('\nStopping server...')
    if (context.data?.server) {
      await context.data.server.close()
    }
  },
})

void runMain(main)
