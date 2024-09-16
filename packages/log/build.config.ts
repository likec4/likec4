import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([
  {
    entries: ['src/index.ts'],
    failOnWarn: false,
    declaration: true,
    rollup: {
      emitCJS: true,
      esbuild: {
        platform: 'neutral'
      },
      commonjs: {
        exclude: [
          /\.ts$/
        ]
      },
      resolve: {
        browser: true
      },
      inlineDependencies: true
    },
    hooks: {
      'rollup:options'(_, options) {
        for (const output of options.output as any[]) {
          // @ts-ignore
          output.exports = 'named'
        }
      }
    }
  },
  {
    entries: ['src/node.ts'],
    declaration: true,
    failOnWarn: false,
    rollup: {
      emitCJS: true,
      esbuild: {
        platform: 'node'
      },
      commonjs: {
        exclude: [
          /\.ts$/
        ]
      },
      resolve: {
        browser: false,
        exportConditions: ['node']
      },
      inlineDependencies: true
    },
    hooks: {
      'rollup:options'(_, options) {
        for (const output of options.output as any[]) {
          // @ts-ignore
          output.exports = 'named'
        }
      }
    }
  }
])
