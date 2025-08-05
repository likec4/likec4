import { viteAliases } from '@/vite/aliases'
import { logger as consola } from '@likec4/log'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import { LikeC4VitePlugin } from '../vite-plugin/plugin'
import type { LikeC4ViteWebcomponentConfig } from './config-webcomponent.prod'
import { chunkSizeWarningLimit, viteLogger } from './utils'

const _dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(_dirname, '../..')

export async function viteWebcomponentConfig({
  languageServices,
  outDir,
  base,
  webcomponentPrefix = 'likec4',
  filename = 'likec4-views.js',
}: LikeC4ViteWebcomponentConfig): Promise<InlineConfig> {
  const customLogger = viteLogger

  const root = resolve(pkgRoot, 'app')
  if (!fs.existsSync(root)) {
    consola.error(`app root does not exist: ${root}`)
    throw new Error(`app root does not exist: ${root}`)
  }

  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  return {
    customLogger,
    root,
    configFile: false,
    resolve: {
      conditions: ['sources'],
      alias: viteAliases(),
    },
    clearScreen: false,
    base,
    publicDir: false,
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      __USE_HASH_HISTORY__: 'false',
      __USE_OVERVIEW_GRAPH__: 'false',
      'process.env.NODE_ENV': '"development"',
    },
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit,
      lib: {
        entry: 'src/webcomponent.tsx',
        fileName(_format, _entryName) {
          return filename
        },
        formats: ['iife'],
        name: 'LikeC4Views',
      },
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
        },
        output: {
          format: 'iife',
          compact: true,
          hoistTransitiveImports: false,
          entryFileNames: filename,
        },
      },
    },
    plugins: [
      react({}),
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
        useOverviewGraph: false,
      }),
    ],
  }
}
