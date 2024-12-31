import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: true,
  rollup: {
    inlineDependencies: true,
    output: {
      chunkFileNames: 'shared/[name].[hash].js',
      entryFileNames: '[name].js',
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
