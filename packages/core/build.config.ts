import { defineBuildConfig } from 'unbuild'

const isProduction = process.env.NODE_ENV === 'production'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: isProduction,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    output: {
      hoistTransitiveImports: false,
    },
    commonjs: {
      exclude: [
        /\.ts$/,
        /\.cts$/,
        /\.mts$/,
      ],
    },
    resolve: {
      browser: true,
    },
  },
})
