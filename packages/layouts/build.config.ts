import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  clean: true,
  stub: !isProduction,
  stubOptions: {
    jiti: {
      moduleCache: false,
      nativeModules: [
        '@hpcc-js/wasm-graphviz',
      ],
    },
  },
  declaration: true,
  rollup: {
    commonjs: {
      exclude: [
        /\.ts$/,
        /\.cts$/,
        /\.mts$/,
      ],
    },
    output: {
      compact: isProduction,
    },
    inlineDependencies: true,
    // dts: {
    //   respectExternal: true,
    //   compilerOptions: {
    //     noEmitOnError: false,
    //     strict: false,
    //     alwaysStrict: false,
    //     skipLibCheck: true,
    //     skipDefaultLibCheck: true
    //   }
    // }
  },
})
