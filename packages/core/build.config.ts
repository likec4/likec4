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
    resolve: {
      browser: true,
    },
    dts: {
      tsconfig: 'tsconfig.build.json',
    },
  },
})
