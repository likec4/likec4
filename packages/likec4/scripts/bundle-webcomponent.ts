import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { consola } from 'consola'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import { shadowStyle } from 'vite-plugin-shadow-style'
import { modules } from '../src/vite/plugin'

export async function buildWebcomponentBundle(_isDev = false) {
  const root = resolve('app')
  const outDir = resolve('dist/__app__/src/lib')
  consola.start(`Bundling Webcomponent...`)
  consola.info(`root: ${root}`)
  consola.info(`outDir: ${outDir}`)

  const outputFilename = 'webcomponent.mjs'

  // Static website
  await build({
    root,
    configFile: false,
    resolve: {
      dedupe: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client'
      ],
      alias: {
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/diagram': resolve('../diagram/src/index.ts')
      }
    },
    clearScreen: false,
    mode: 'production',
    define: {
      __USE_SHADOW_STYLE__: 'true',
      __USE_HASH_HISTORY__: 'false',
      'process.env.NODE_ENV': '"production"'
    },
    esbuild: {
      treeShaking: true,
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true
    },
    build: {
      outDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      cssMinify: true,
      sourcemap: false,
      minify: 'esbuild',
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
        esmExternals: true,
        ignoreTryCatch: 'remove',
        transformMixedEsModules: true
      },
      rollupOptions: {
        treeshake: true,
        external: [
          'virtual:likec4',
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

  let webcomponent = await readFile(outputFilepath, 'utf-8')
  let updated = webcomponent.replace('loadExternalIsValidProp(require("@emotion/is-prop-valid").default);', '')

  if (updated !== webcomponent) {
    await writeFile(outputFilepath, updated)
  } else if (webcomponent.includes('@emotion/is-prop-valid')) {
    throw new Error(
      'webcomponent.mjs should contain loadExternalIsValidProp(require("@emotion/is-prop-valid").default)'
    )
  }

  await rm(resolve(outDir, 'style.css'))
}
