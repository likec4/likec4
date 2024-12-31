import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([
  {
    entries: ['src/browser.ts'],
    failOnWarn: false,
    declaration: false,
    clean: true,
    rollup: {
      emitCJS: true,
      esbuild: {
        platform: 'browser',
      },
      resolve: {
        browser: true,
      },
      inlineDependencies: true,
    },
    // hooks: {
    //   'rollup:options'(_, options) {
    //     for (const output of options.output as any[]) {
    //       // @ts-ignore
    //       output.exports = 'named'
    //     }
    //   }
    // }
  },
  {
    entries: ['src/index.ts'],
    declaration: true,
    // failOnWarn: false,
    clean: false,
    rollup: {
      emitCJS: true,
      esbuild: {
        platform: 'node',
      },
      commonjs: {
        exclude: [
          /\.ts$/,
        ],
      },
      resolve: {
        browser: false,
        exportConditions: ['node'],
      },
      inlineDependencies: true,
    },
    // hooks: {
    //   'rollup:options'(_, options) {
    //     for (const output of options.output as any[]) {
    //       // @ts-ignore
    //       output.exports = 'named'
    //     }
    //   }
    // }
  },
])
