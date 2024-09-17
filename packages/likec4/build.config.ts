import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

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
        'json5'
      ]
    }
  },
  alias: {
    // '@/vite/config-app': resolve('src/vite/config-app.ts'),
    // '@/vite/config-react': resolve('src/vite/config-react.ts'),
    // '@/vite/config-webcomponent': resolve('src/vite/config-webcomponent.ts'),
    '@/vite/config-app': resolve('src/vite/config-app.prod.ts'),
    '@/vite/config-react': resolve('src/vite/config-react.prod.ts'),
    '@/vite/config-webcomponent': resolve('src/vite/config-webcomponent.prod.ts'),
    ...(isProduction && {
      '@/vite/config-app': resolve('src/vite/config-app.prod.ts'),
      '@/vite/config-react': resolve('src/vite/config-react.prod.ts'),
      '@/vite/config-webcomponent': resolve('src/vite/config-webcomponent.prod.ts'),
      '@likec4/layouts/graphviz/wasm': resolve('../layouts/dist/graphviz/wasm/index.mjs'),
      '@likec4/layouts/graphviz/binary': resolve('../layouts/dist/graphviz/binary/index.mjs'),
      '@likec4/layouts': resolve('../layouts/dist/index.mjs'),
      '@likec4/core/types': resolve('../core/dist/types/index.mjs'),
      '@likec4/core': resolve('../core/dist/index.mjs'),
      '@likec4/language-server/model-graph': resolve('../language-server/dist/model-graph/index.mjs'),
      '@likec4/language-server': resolve('../language-server/dist/index.mjs')
    })
  },
  failOnWarn: false,
  declaration: isProduction,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      platform: 'node',
      legalComments: 'none',
      minify: isProduction,
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true
    },
    output: {
      compact: isProduction
    },
    resolve: {
      exportConditions: ['node']
    },
    commonjs: {
      transformMixedEsModules: true,
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
