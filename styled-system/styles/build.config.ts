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
  declaration: true,
  failOnWarn: false,
  rollup: {
    inlineDependencies: true,
  },
  hooks: {
    async 'build:before'() {
      await spawn('panda', ['codegen'], {
        stdio: 'inherit',
        preferLocal: true,
      })
      // mock entry file for module resolution
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
