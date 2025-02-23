import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: true,
  rollup: {
    alias: {
      entries: {
        'object-hash': 'object-hash/dist/object_hash.js',
      },
    },
    inlineDependencies: true,
    output: {
      hoistTransitiveImports: false,
    },
    commonjs: {
      exclude: [
        /\.(c|m)?ts$/,
      ],
    },
  },
})
