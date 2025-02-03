import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: true,
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
