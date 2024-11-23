import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  clean: isProduction,
  stub: !isProduction,
  declaration: true,
  alias: {
    'object-hash': 'object-hash/dist/object_hash'
  },
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    commonjs: {
      exclude: [
        /\.d\.ts$/,
        /\.d\.cts$/,
        /\.d\.mts$/
      ]
    },
    resolve: {
      browser: true
    },
    dts: {
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
