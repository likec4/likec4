/* eslint-disable */
import { $ } from 'execa'
import { defineBuildConfig } from 'unbuild'

const pattern = ['**/*.ts', '!**/*.spec.ts']

// prettier-ignore
export default defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      input: './src/',
      outDir: './dist/',
      format: 'esm',
      ext: 'js',
      pattern
    }
  ],
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: false,
  hooks: {
    'build:before': async (ctx) => {
      await $`tsc --emitDeclarationOnly --declaration --declarationMap -p tsconfig.src.json`
    }
  }
})
