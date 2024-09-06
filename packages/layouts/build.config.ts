import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  clean: isProduction,
  stub: !isProduction,
  declaration: isProduction,
  rollup: {
    commonjs: {
      transformMixedEsModules: true,
      exclude: [
        /\.d\.ts$/,
        /\.d\.cts$/,
        /\.d\.mts$/
      ]
    },
    output: {
      hoistTransitiveImports: false
    },
    inlineDependencies: true,
    dts: {
      respectExternal: true,
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
