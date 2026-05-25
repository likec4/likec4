import { defineConfig } from '@likec4/devops/tsdown'
import spawn from 'nano-spawn'

export default defineConfig({
  entry: [
    'src/defaults/index.ts',
    'src/index.ts',
  ],
  unbundle: true,
  dts: true,
  platform: 'neutral',
  minify: false,
  format: ['esm'],
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
