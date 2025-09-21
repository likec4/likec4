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
      chunkSizeWarningLimit: 2000,
      cssCodeSplit: true,
      cssMinify: true,
      minify: true,
      sourcemap: false,
      assetsInlineLimit: 2_000_000,
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
    // css: {
    //   modules: false,
    //   postcss: {
    //     plugins: [
    //       pandaCss(),
    //     ],
    //   },
    // },
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

// try {
//   const coreExports = Object
//     .keys(packageJson.exports)
//     .map((key) => `@likec4/core${key.slice(1)}`)
//   console.info('Bundle react')
//   const { errors, warnings } = await build({
//     entryPoints: [
//       'react/index.ts',
//     ],
//     outfile: 'react/index.mjs',
//     platform: 'browser',
//     format: 'esm',
//     color: true,
//     bundle: true,
//     treeShaking: true,
//     define: {
//       'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production'),
//     },
//     external: [
//       'react',
//       'react-dom',
//       'react/jsx-runtime',
//       'react/jsx-dev-runtime',
//       'react-dom/client',
//       'type-fest',
//       ...coreExports,
//     ],
//     minify: isProduction,
//     minifyIdentifiers: false,
//     minifySyntax: isProduction,
//     minifyWhitespace: isProduction,
//   })

//   if (errors.length) {
//     console.error(formatMessagesSync(errors, {
//       kind: 'error',
//       color: true,
//       terminalWidth: process.stdout.columns,
//     }))
//   }
//   if (warnings.length) {
//     console.warn(formatMessagesSync(warnings, {
//       kind: 'warning',
//       color: true,
//       terminalWidth: process.stdout.columns,
//     }))
//   }
//   if (errors.length || warnings.length) {
//     console.error('⛔️ Build failed')
//     process.exit(1)
//   }
// } catch (e) {
//   console.error('⛔️ Build failed')
//   console.error(e)
//   process.exit(1)
// }

// console.info('✅ React bundle done')
// console.info('generating dts bundle')

// try {
//   const [dts] = await generateDtsBundle([
//     {
//       filePath: './react/index.ts',
//       libraries: {
//         // inlinedLibraries: [
//         //   'xstate',
//         //   '@react-hookz/web',
//         //   '@likec4/diagram',
//         //   '@xyflow/react',
//         //   '@xyflow/system',
//         // ],
//         // importedLibraries: [
//         //   'type-fest',
//         //   // '@likec4/core/types',
//         //   // '@likec4/core/utils',
//         //   // '@likec4/core/styles',
//         //   // '@likec4/core/model',
//         //   '@likec4/core',
//         // ],
//       },
//       output: {
//         inlineDeclareGlobals: false,
//         // exportReferencedTypes: false,
//       },
//     },
//     // {
//     //   filePath: './react/custom/index.ts',
//     //   libraries: {
//     //     inlinedLibraries: [
//     //       '@likec4/diagram/bundle',
//     //       '@likec4/diagram',
//     //       '@xyflow/react',
//     //       '@xyflow/system',
//     //     ],
//     //   },
//     //   output: {
//     //     inlineDeclareGlobals: false,
//     //     // exportReferencedTypes: false,
//     //   },
//     // },
//   ], {
//     preferredConfigPath: 'tsconfig.react-bundle.json',
//   })

//   if (!dts) {
//     console.error('⛔️ Failed to generate dts bundle')
//     process.exit(1)
//   }

//   await writeFile('react/index.d.mts', dts, 'utf-8')
//   console.info('✅ React Typings done')
//   process.exit(0)
// } catch (e) {
//   console.error('⛔️ Failed to generate dts bundle', e)
//   process.exit(1)
// }
