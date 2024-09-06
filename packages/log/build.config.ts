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
    }
  }
])
