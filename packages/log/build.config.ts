import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: 'node16',
  rollup: {
    emitCJS: false,
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
