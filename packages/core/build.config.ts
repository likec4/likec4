import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  stub: false,
  declaration: true,
  rollup: {
    inlineDependencies: true,
    output: {
      hoistTransitiveImports: false,
    },
    commonjs: {
      exclude: [
        /\.(c|m)?ts$/,
      ],
    },
    resolve: {
      browser: true,
    },
  },
})
