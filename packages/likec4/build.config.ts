import { consola } from 'consola'
import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { isProduction } from 'std-env'
import { type BuildConfig, defineBuildConfig } from 'unbuild'

if (!isProduction) {
  consola.warn('Bundling CLI in development mode')
}

const cli: BuildConfig = {
  entries: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/model/index.ts',
    'src/vite-plugin/index.ts',
  ],
  clean: isProduction,
  outDir: 'dist',
  stub: !isProduction,
  failOnWarn: false,
  stubOptions: {
    jiti: {
      moduleCache: false,
      alias: {
        '@/vite/': resolve('src/vite/'),
        '@likec4/core': resolve('../core/src/'),
        '@likec4/layouts': resolve('../layouts/src/'),
        '@likec4/language-server': resolve('../language-server/src/'),
      },
      nativeModules: [
        'json5',
        '@hpcc-js/wasm-graphviz',
        'vite',
        '@vitejs/plugin-react',
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
  declaration: isProduction ? 'node16' : false,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      platform: 'node',
      target: 'node20',
      legalComments: 'none',
      minify: isProduction,
      minifyIdentifiers: false,
      lineLimit: 500,
    },
    output: {
      compact: isProduction,
    },
    resolve: {
      exportConditions: ['node', 'sources'],
    },
    commonjs: {
      exclude: [
        /\.d\.ts$/,
        /\.d\.cts$/,
        /\.d\.mts$/,
      ],
    },
    dts: {
      tsconfig: 'tsconfig.cli.json',
      compilerOptions: {
        customConditions: [
          'node',
          // 'sources',
        ],
        noCheck: true,
        strict: false,
        alwaysStrict: false,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        exactOptionalPropertyTypes: false,
      },
    },
  },
  hooks: {
    async 'build:before'() {
      await copyFile('./src/vite-plugin/modules.d.ts', './vite-plugin-modules.d.ts')
    },
  },
}

export default defineBuildConfig([
  // reactbundle,
  cli,
])
