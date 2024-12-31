import { consola } from 'consola'
import { resolve } from 'node:path'
import { isProduction } from 'std-env'
import { defineBuildConfig } from 'unbuild'

if (!isProduction) {
  consola.warn('Bundling CLI in development mode')
}

export default defineBuildConfig({
  entries: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/model/index.ts',
  ],
  clean: isProduction,
  outDir: 'dist',
  stub: !isProduction,
  stubOptions: {
    jiti: {
      interopDefault: true,
      nativeModules: [
        'json5',
        '@hpcc-js/wasm-graphviz',
        'vite',
        '@vitejs/plugin-react-swc',
      ],
    },
  },
  alias: {
    ...(isProduction
      ? {
        '@/vite/aliases': resolve('src/vite/aliases.prod.ts'),
        '@/vite/config-app': resolve('src/vite/config-app.prod.ts'),
        '@/vite/config-react': resolve('src/vite/config-react.prod.ts'),
        '@/vite/config-webcomponent': resolve('src/vite/config-webcomponent.prod.ts'),
      }
      : {}),
  },
  failOnWarn: false,
  declaration: isProduction,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      platform: 'node',
      target: 'node20',
      legalComments: 'none',
      minify: isProduction,
    },
    output: {
      compact: isProduction,
      chunkFileNames: 'shared/[name].[hash].js',
      entryFileNames: '[name].js',
    },
    resolve: {
      exportConditions: isProduction ? ['node', 'production'] : ['development'],
    },
    commonjs: {
      exclude: [
        /\.ts$/,
        /\.cts$/,
        /\.mts$/,
      ],
    },
    dts: {
      // tsconfig: 'tsconfig.cli.json',
      // respectExternal: true,
      compilerOptions: {
        customConditions: [],
        noEmitOnError: false,
        strict: false,
        alwaysStrict: false,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
      },
    },
  },
})
