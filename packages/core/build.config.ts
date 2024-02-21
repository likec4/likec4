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
      outDir: './dist/cjs/',
      format: 'cjs',
      ext: 'js',
      declaration: true,
      esbuild: {
        sourcemap: true
      },
      pattern
    },
    {
      builder: 'mkdist',
      input: './src/',
      outDir: './dist/esm/',
      format: 'esm',
      ext: 'js',
      declaration: true,
      esbuild: {
        sourcemap: true
      },
      pattern
    }
  ],
  // if clean enabled, TS Language server in VSCode has to be restarted
  clean: false,
  sourcemap: true,
  hooks: {
    'build:before': async (ctx) => {
      await $`tsc --emitDeclarationOnly --declaration --declarationMap -p tsconfig.src.json`
    }
  }
})
