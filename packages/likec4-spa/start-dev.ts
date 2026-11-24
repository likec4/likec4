#!/usr/bin/env -S pnpm tsx

import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import postcssPanda from '@pandacss/dev/postcss'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
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
    customization: {
      type: 'string',
      valueHint: 'file',
      description: 'file with UI customizations (default export of defineCustomComponents)',
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

    const server = await createServer({
      configFile: false,
      logLevel: 'info',
      clearScreen: false,
      env: {
        NODE_ENV: 'development',
      },
      mode: 'development',
      css: {
        transformer: 'postcss',
        postcss: {
          plugins: [
            postcssPanda() as any,
          ],
        },
      },
      server: {
        fs: {
          strict: false,
        },
        allowedHosts: true,
      },
      resolve: {
        tsconfigPaths: true,
        conditions: ['sources', 'import', 'default'],
        alias: {
          // Local paths for dev
          // Virtual modules import `likec4/*`, tsconfig paths do not apply to them
          'likec4/react': resolve('shims/react.ts'),
          'likec4/model': resolve('shims/model.ts'),
          'likec4/vite-plugin/internal': resolve('shims/vite-plugin.ts'),
          '@likec4/diagram/custom': resolve('../diagram/src/custom/index.ts'),
          '@likec4/diagram': resolve('../diagram/src/index.ts'),
        },
      },
      plugins: [
        LikeC4VitePlugin({
          workspace,
          customization: context.args.customization ? resolve(context.args.customization) : undefined,
          ai: 'disabled',
          logLevel: context.args.verbose ? 'trace' : 'debug',
        }),
        tanstackRouter(),
        react({
          compiler: true,
          exclude: [/\.d\.[cm]?ts$/],
        }),
      ],
    })

    await server.listen()

    // await server.waitForRequestsIdle()
    console.log('')
    server.printUrls()
    console.log('')

    process.on('SIGINT', () => {
      server.close().then(() => {
        process.exit(0)
      }).catch((error) => {
        console.error('Error stopping server:', error)
        process.exit(1)
      })
    })
  },
})

void runMain(main)
