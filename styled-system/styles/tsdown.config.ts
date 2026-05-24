import spawn from 'nano-spawn'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './index.mts',
    './preset.mts',
  ],
  outDir: 'dist/pkg',
  clean: false,
  dts: {
    enabled: true,
    eager: true,
  },
  minify: false,
  hooks: {
    'build:prepare': async () => {
      await spawn('panda', ['codegen', '--clean'], {
        stdio: 'inherit',
        preferLocal: true,
      })
    },
  },
})
