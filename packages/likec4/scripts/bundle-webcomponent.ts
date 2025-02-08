import react from '@vitejs/plugin-react-swc'
import { consola } from 'consola'
import { readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'vite'
import { amIExecuted } from './_utils'

export async function buildWebcomponentBundle(_isDev = false) {
  const root = resolve('app')
  const outDir = resolve('__app__/webcomponent')
  consola.start(`Bundling Webcomponent...`)
  consola.info(`root: ${root}`)
  consola.info(`outDir: ${outDir}`)

  const outputFilename = 'webcomponent.js'

  // Static website
  await build({
    root,
    configFile: false,
    resolve: {
      conditions: ['production', 'sources'],
      alias: {
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        'react-dom/server': resolve('app/react/react-dom-server-mock.ts'),
      },
    },
    clearScreen: false,
    mode: 'production',
    define: {
      __USE_STYLE_BUNDLE__: 'true',
      __USE_HASH_HISTORY__: 'false',
      'process.env.NODE_ENV': '"production"',
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
          jsx: 'react-jsx',
        },
      },
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
        formats: ['es'],
      },
      commonjsOptions: {
        defaultIsModuleExports: 'auto',
        requireReturnsDefault: 'auto',
        extensions: ['.js', '.mjs'],
        transformMixedEsModules: true,
        ignoreTryCatch: 'remove',
      },
      rollupOptions: {
        treeshake: {
          preset: 'safest',
        },
        output: {
          // hoistTransitiveImports: false,
          compact: true,
          interop: 'auto',
        },
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'likec4/react',
          'likec4/model',
          '@emotion/is-prop-valid', // dev-only import from framer-motion
          /@likec4\/core.*/,
          /virtual\:likec4/,
        ],
      },
    },
    plugins: [
      react({}),
    ],
  })

  const outputFilepath = resolve(outDir, outputFilename)

  let bundledJs = await readFile(outputFilepath, 'utf-8')
  if (bundledJs.includes('@emotion/is-prop-valid')) {
    throw new Error(
      `${outputFilepath} should not import "@emotion/is-prop-valid"`,
    )
  }

  // await rm(resolve(outDir, 'style.css'))
}

if (amIExecuted(import.meta.filename)) {
  consola.info('Running as script')
  await buildWebcomponentBundle()
}
