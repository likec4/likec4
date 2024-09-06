import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      platform: 'node',
      target: 'node20',
      minify: true
    }
  },
  alias: {
    // we can always use non-transpiled code since we support node 18+
    prompts: 'prompts/lib/index.js'
  }
})
