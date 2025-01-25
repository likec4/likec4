import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import autoprefixer from 'autoprefixer'
import { consola } from 'consola'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import dts from 'vite-plugin-dts'
import { shadowStyle } from 'vite-plugin-shadow-style'
import { amIExecuted } from './_utils'

export async function buildReact(_isDev = false) {
  const root = resolve('app/react')
  const outDir = resolve('react')
  consola.start(`Bundling React components...`)
  consola.info(`root: ${root}`)
  consola.info(`outDir: ${outDir}`)

  const outputFilename = 'index.js'

  const tsconfig = resolve('app/react/tsconfig.dts-bundle.json')

  // Static website
  await build({
    root,
    configFile: false,
    resolve: {
      conditions: ['production'],
      alias: {
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        // '@likec4/core/model': resolve('../core/src/model'),
        // '@likec4/core/types': resolve('../core/src/types'),
        // '@likec4/core': resolve('../core/src'),
        // '@likec4/diagram': resolve('../diagram/src'),
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
      legalComments: 'none',
      tsconfigRaw: readFileSync(tsconfig, { encoding: 'utf-8' }),
    },
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      cssMinify: true,
      minify: true,
      sourcemap: false,
      copyPublicDir: false,
      chunkSizeWarningLimit: 2000,
      lib: {
        entry: 'components/index.ts',
        name: 'index',
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
          compact: true,
        },
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'likec4/model',
          'likec4/react',
          /@likec4\/core/,
          '@emotion/is-prop-valid', // dev-only import from framer-motion
        ],
        plugins: [
          shadowStyle(),
        ],
      },
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          postcssPresetMantine(),
        ],
      },
    },
    plugins: [
      react(),
      vanillaExtractPlugin({
        identifiers: 'short',
      }),
      dts({
        // entryRoot: resolve('app/react/components'),
        tsconfigPath: resolve('app/react/tsconfig.dts-bundle.json'),
        rollupTypes: true,
        staticImport: true,
        bundledPackages: [
          '@mantine/core',
          '@mantine/hooks',
          '@xyflow/react',
          '@xyflow/system',
          '@likec4/diagram',
          'nanostores',
          '@nanostores/react',
        ],
        compilerOptions: {
          declarationMap: false,
        },
      }),
    ],
  })
  const outputFilepath = resolve(outDir, outputFilename)

  let bundledJs = await readFile(outputFilepath, 'utf-8')
  if (bundledJs.includes('@emotion/is-prop-valid')) {
    throw new Error(
      `${outputFilepath} should not import "@emotion/is-prop-valid"`,
    )
  }
}

if (amIExecuted(import.meta.filename)) {
  consola.info('Running as script')
  await buildReact()
}
