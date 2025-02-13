import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    // esbuild: {
    //   platform: 'node',
    // },
    // commonjs: {
    //   exclude: [
    //     /\.ts$/,
    //     /\.cts$/,
    //     /\.mts$/,
    //   ],
    // },
    // resolve: {
    //   browser: false,
    //   exportConditions: ['node', 'production'],
    // },
  },
})
