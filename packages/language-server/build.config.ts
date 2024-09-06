import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  clean: isProduction,
  stub: !isProduction,
  stubOptions: {
    jiti: {
      nativeModules: [
        '@dagrejs/graphlib'
      ]
    }
  },
  declaration: isProduction,
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
    output: {
      hoistTransitiveImports: false
    },
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
