import process from 'node:process'
import { resolve } from 'path'
import { build } from 'vite'
import dts from 'vite-plugin-dts'

const cwd = process.cwd()

const root = resolve(cwd, '.')
const outDir = resolve(cwd, 'react')
console.info(`Bundling React...`)
console.info(`root: ${root}`)

// Static website
await build({
  root,
  configFile: false,
  clearScreen: false,
  mode: 'production',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  resolve: {
    alias: {
      'react-dom/server': resolve('app/react/react-dom-server-mock.ts'),
    },
  },
  esbuild: {
    jsxDev: false,
    minifyIdentifiers: false,
    platform: 'browser',
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
    rollupOptions: {
      output: {
        exports: 'named',
      },
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
        '@xstate/react',
        'xstate',
        '@react-hookz/web',
      ],
      afterRollup(result) {
        if (result.errorCount > 0) {
          console.error('Rollup failed')
          process.exit(1)
        }
      },
    }),
  ],
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
