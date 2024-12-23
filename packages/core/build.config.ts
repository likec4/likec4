import { defineBuildConfig } from 'unbuild'

const isProduction = process.env['NODE_ENV'] === 'production'

export default defineBuildConfig({
  clean: true,
  stub: !isProduction,
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
