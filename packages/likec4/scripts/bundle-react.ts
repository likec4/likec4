// import { generateDtsBundle } from 'dts-bundle-generator'
// import { build, formatMessagesSync } from 'esbuild'
// import pandaCss from '@likec4/styles/postcss'
import process from 'node:process'
import { resolve } from 'path'
import { build } from 'vite'
import dts from 'vite-plugin-dts'
// import { build } from 'vite'

import { amIExecuted } from './_utils'

export async function bundleReact() {
  const cwd = process.cwd()

  const root = resolve(cwd, '.')
  const outDir = resolve(cwd, 'react')
  console.info(`Bundling React...`)
  console.info(`root: ${root}`)

  // const tsconfig = await readFile('app/tsconfig.json', 'utf-8')

  // Static website
  await build({
    root,
    configFile: false,
    clearScreen: false,
    mode: 'production',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    esbuild: {
      jsxDev: false,
      minifyIdentifiers: false,
      // tsconfigRaw: tsconfig,
    },
    build: {
      emptyOutDir: false,
      outDir,
      target: 'esnext',
      cssCodeSplit: true,
      minify: true,
      sourcemap: false,
      lib: {
        entry: {
          index: 'react/index.ts',
        },
        formats: ['es'],
      },
      // commonjsOptions: {
      //   defaultIsModuleExports: 'auto',
      //   requireReturnsDefault: 'auto',
      //   extensions: ['.mjs', '.js'],
      //   transformMixedEsModules: true,
      //   ignoreTryCatch: 'remove',
      // },
      rollupOptions: {
        external: [
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'react',
          'react-dom',
          'likec4/model',
          'likec4/react',
          '@emotion/is-prop-valid', // dev-only import from motion
          /@likec4\/core.*/,
          /likec4:/,
        ],
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return
          }
          warn(warning)
        },
      },
    },
    plugins: [
      // tsconfig({
      //   projects: ['./tsconfig.react-bundle.json'],
      // }),
      // react({}),
      dts({
        root: 'react',
        tsconfigPath: '../tsconfig.react-bundle.json',
        outDir: '.',
        rollupTypes: true,
        bundledPackages: [
          '@likec4/diagram',
          '@react-hookz/web',
        ],
      }),
    ],
  })
}

if (amIExecuted(import.meta.filename)) {
  console.info('Running as script')
  await bundleReact()
}
