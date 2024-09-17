import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import { consola } from 'consola'
import { readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import { shadowStyle } from 'vite-plugin-shadow-style'
import { modules } from '../src/vite/plugin'
import { amIExecuted } from './_utils'

export async function buildWebcomponentBundle(_isDev = false) {
  const root = resolve('app')
  const outDir = resolve('dist/__app__/webcomponent')
  consola.start(`Bundling Webcomponent...`)
  consola.info(`root: ${root}`)
  consola.info(`outDir: ${outDir}`)

  const outputFilename = 'webcomponent.js'

  // Static website
  await build({
    root,
    configFile: false,
    resolve: {
      alias: {
        '@likec4/core': resolve('../core/src'),
        '@likec4/diagram': resolve('../diagram/src'),
        'react-dom/server': resolve('app/react/react-dom-server-mock.ts')
      }
    },
    clearScreen: false,
    mode: 'production',
    define: {
      __USE_STYLE_BUNDLE__: 'true',
      __USE_HASH_HISTORY__: 'false',
      'process.env.NODE_ENV': '"production"'
    },
    esbuild: {
      jsxDev: false,
      minifyIdentifiers: false,
      minifyWhitespace: true,
      minifySyntax: true,
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: true,
          verbatimModuleSyntax: true,
          jsx: 'react-jsx'
        }
      }
    },
    build: {
      outDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: true,
      target: 'es2020',
      copyPublicDir: false,
      chunkSizeWarningLimit: 2000,
      lib: {
        entry: 'webcomponent/webcomponent.tsx',
        fileName(_format, _entryName) {
          return outputFilename
        },
        formats: ['es']
      },
      commonjsOptions: {
        defaultIsModuleExports: 'auto',
        requireReturnsDefault: 'auto',
        extensions: ['.js', '.mjs'],
        transformMixedEsModules: true,
        ignoreTryCatch: 'remove'
      },
      rollupOptions: {
        treeshake: {
          preset: 'safest'
        },
        output: {
          // hoistTransitiveImports: false,
          compact: true,
          interop: 'auto'
        },
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'likec4/react',
          'likec4',
          '@emotion/is-prop-valid', // dev-only import from framer-motion
          ...modules.map(m => m.id)
        ],
        plugins: [
          shadowStyle()
        ]
      }
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          postcssPresetMantine()
        ]
      }
    },
    plugins: [
      react({}),
      vanillaExtractPlugin({
        identifiers: 'short'
      })
    ]
  })

  const outputFilepath = resolve(outDir, outputFilename)

  let bundledJs = await readFile(outputFilepath, 'utf-8')
  if (bundledJs.includes('@emotion/is-prop-valid')) {
    throw new Error(
      `${outputFilepath} should not import "@emotion/is-prop-valid"`
    )
  }

  await rm(resolve(outDir, 'style.css'))
}

if (amIExecuted(import.meta.filename)) {
  consola.info('Running as script')
  await buildWebcomponentBundle()
}
