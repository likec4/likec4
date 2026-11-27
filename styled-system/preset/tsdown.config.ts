import spawn from 'nano-spawn'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/defaults/index.ts',
    'src/index.ts',
  ],
  dts: {
    generator: 'tsrs',
  },
  cjsDefault: false,
  minify: false,
  deps: {
    onlyBundle: [
      '@radix-ui/colors',
    ],
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
