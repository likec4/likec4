import { resolve } from 'node:path'
import { isProduction } from 'std-env'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index.ts',
    'src/cli/index.ts'
  ],
  clean: false,
  outDir: 'dist',
  stub: !isProduction,
  stubOptions: {
    jiti: {
      interopDefault: true,
      nativeModules: [
        'json5',
        '@hpcc-js/wasm-graphviz',
        'vite',
        '@vitejs/plugin-react-swc'
      ]
    }
  },
  alias: {
    '@/vite/config-app': resolve('src/vite/config-app.prod.ts'),
    '@/vite/config-react': resolve('src/vite/config-react.prod.ts'),
    '@/vite/config-webcomponent': resolve('src/vite/config-webcomponent.prod.ts'),
    ...(isProduction
      ? {
        '@likec4/layouts/graphviz/binary': resolve('../layouts/dist/graphviz/binary/index.mjs'),
        '@likec4/layouts': resolve('../layouts/dist/index.mjs'),
        '@likec4/core/types': resolve('../core/dist/types/index.mjs'),
        '@likec4/core/compute-view': resolve('../core/dist/compute-view/index.mjs'),
        '@likec4/core': resolve('../core/dist/index.mjs'),
        '@likec4/language-server': resolve('../language-server/dist/index.mjs')
      }
      : {
        '@likec4/layouts/graphviz/binary': resolve('../layouts/src/graphviz/binary/index.ts'),
        '@likec4/layouts': resolve('../layouts/src/index.ts'),
        '@likec4/core/types': resolve('../core/src/types/index.ts'),
        '@likec4/core/compute-view': resolve('../core/src/compute-view/index.ts'),
        '@likec4/core': resolve('../core/src/index.ts'),
        '@likec4/language-server': resolve('../language-server/src/index.ts')
      })
  },
  failOnWarn: false,
  declaration: isProduction,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      platform: 'node',
      target: 'node20',
      legalComments: 'none',
      minify: isProduction
    },
    output: {
      compact: isProduction
    },
    resolve: {
      exportConditions: ['node']
    },
    commonjs: {
      ignoreTryCatch: 'remove',
      esmExternals: true,
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
      exclude: [
        /\.d\.ts$/,
        /\.d\.cts$/,
        /\.d\.mts$/
      ]
    },
    dts: {
      tsconfig: 'tsconfig.cli.json',
      compilerOptions: {
        noEmitOnError: false,
        strict: false,
        alwaysStrict: false,
        skipLibCheck: true,
        skipDefaultLibCheck: true
      }
    }
  }
})
