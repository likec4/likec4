import { defineBuildConfig } from 'unbuild'

const isProduction = process.env['NODE_ENV'] === 'production'

export default defineBuildConfig({
  clean: isProduction,
  stub: !isProduction,
  declaration: true,
  rollup: {
    inlineDependencies: true,
    commonjs: {
      exclude: [
        /\.ts$/,
        /\.cts$/,
        /\.mts$/
      ]
    },
    resolve: {
      browser: true
    }
    // dts: {
    //   compilerOptions: {
    //     noEmitOnError: false,
    //     strict: false,
    //     alwaysStrict: false,
    //     skipLibCheck: true,
    //     skipDefaultLibCheck: true
    //   }
    // }
  }
})
