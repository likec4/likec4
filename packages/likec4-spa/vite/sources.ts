import type { AppSource } from './app-source'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcssPanda from '@pandacss/dev/postcss'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'

/**
 * Root of the `@likec4/spa` package
 */
const spaRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The LikeC4 app from the sources of `@likec4/spa` and the other packages of the monorepo.
 * For development only: requires the `sources` condition and the dev dependencies of `@likec4/spa`.
 */
export function appFromSources(): AppSource {
  return {
    root: spaRoot,
    assetsDir: resolve(spaRoot, 'public'),
    entries: {
      app: ['index.html', 'src/main.tsx', 'src/fonts.css', 'src/style.css'],
      react: 'codegen/react.tsx',
      webcomponent: 'codegen/webcomponent.tsx',
    },
    config: {
      css: {
        transformer: 'postcss',
        postcss: {
          plugins: [
            postcssPanda() as any,
          ],
        },
      },
      resolve: {
        tsconfigPaths: true,
        conditions: ['sources', 'import', 'default'],
        alias: {
          // Virtual modules import `likec4/*`, tsconfig paths do not apply to them
          'likec4/react': resolve(spaRoot, 'shims/react.ts'),
          'likec4/model': resolve(spaRoot, 'shims/model.ts'),
          'likec4/vite-plugin/internal': resolve(spaRoot, 'shims/vite-plugin.ts'),
          '@likec4/diagram/custom': resolve(spaRoot, '../diagram/src/custom/index.ts'),
          '@likec4/diagram': resolve(spaRoot, '../diagram/src/index.ts'),
        },
        // The customization file is outside of the app root, resolve React from the app
        dedupe: ['react', 'react-dom'],
      },
    },
    plugins: [
      tanstackRouter(),
      react({
        compiler: true,
        exclude: [/\.d\.[cm]?ts$/],
      }),
    ],
  }
}
