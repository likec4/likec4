import { outputOptions } from '@likec4/devops/tsdown'
import spawn from 'nano-spawn'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/defaults/*.ts',
    'src/**/index.ts',
  ],
  // unbundle: true,
  dts: true,
  platform: 'neutral',
  minify: false,
  format: ['esm'],
  outputOptions: outputOptions(),
  deps: {
    onlyBundle: false,
  },
  hooks: {
    'build:prepare': async () => {
      console.log('build:prepare')
      await spawn('tsx', ['generate.ts'], {
        preferLocal: true,
        stdio: 'inherit',
      })
    },
  },
})
