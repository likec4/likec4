/* eslint-disable */
import type { MkdistOptions } from 'mkdist'
import { defineBuildConfig } from 'unbuild'
import { $ } from 'execa'

const opts = {
  pattern: ['**/*.{ts,tsx}', '!stories/**'],
  esbuild: {
    jsx: 'automatic',
    platform: 'browser'
  }
} satisfies MkdistOptions

// prettier-ignore
export default defineBuildConfig({
  entries: [
    {
      builder: "mkdist",
      input: "./src/",
      outDir: "./dist/",
      format: "esm",
      ext: 'js',
      ...opts
    }
  ],
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: false,
  hooks: {
    'build:before': async (ctx) => {
      await $`tsc --emitDeclarationOnly --declaration --declarationMap --listFiles`
    }
  }
})
