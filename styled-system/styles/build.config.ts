import spawn from 'nano-spawn'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'preset.ts',
  ],
  outDir: 'dist',
  clean: false,
  stub: false,
  declaration: 'node16',
  failOnWarn: false,
  rollup: {
    inlineDependencies: true,
  },
  hooks: {
    async 'build:before'(ctx) {
      await spawn('pnpm', ['generate'])
      if (!existsSync('dist/types/index.mjs')) {
        try {
          await writeFile('dist/types/index.mjs', 'export {}')
        } catch (e) {
          console.error('Failed to create dist/types/index.mjs', e)
        }
      }
    },
  },
})
