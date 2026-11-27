import { defineConfig } from '@likec4/devops/tsdown'
import spawn from 'nano-spawn'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/node/index.ts',
    'src/webapp-export-formats.ts',
  ],
  unbundle: true,
  minify: false,
  deps: {
    neverBundle: [
      '@logtape/logtape',
      /^node:/,
    ],
  },
  dts: {
    generator: 'tsrs',
  },
  hooks: {
    'build:done': async () => {
      await spawn('pnpm', ['run', 'generate'], {
        preferLocal: true,
        stdio: 'inherit',
      })
    },
  },
})
