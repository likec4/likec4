import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  clean: isProduction,
  stub: !isProduction,
  declaration: 'node16',
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
