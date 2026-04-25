#!/usr/bin/env -S pnpm tsx

import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import postcssPanda from '@pandacss/dev/postcss'
import babel from '@rolldown/plugin-babel'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
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

    context.data ??= {}

    const server = context.data.server = await createServer({
      configFile: false,
      logLevel: 'info',
      clearScreen: false,
      env: {
        NODE_ENV: 'development',
      },
      mode: 'development',
      css: {
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
        conditions: ['sources'],
        alias: {
          '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
          'react-dom/server': resolve(import.meta.dirname, 'src/react-dom-server-mock.ts'),
          // Local paths for dev
          '@likec4/diagram/custom': resolve(import.meta.dirname, '../diagram/src/custom/index.ts'),
          '@likec4/diagram': resolve(import.meta.dirname, '../diagram/src/index.ts'),
          'likec4/vite-plugin/internal': resolve(import.meta.dirname, '../vite-plugin/src/internal.ts'),
        },
      },
      plugins: [
        TanStackRouterVite(),
        react(),
        babel({
          presets: [reactCompilerPreset()],
        }) as any,
        LikeC4VitePlugin({
          workspace,
          logLevel: context.args.verbose ? 'trace' : 'debug',
        }),
      ],
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
