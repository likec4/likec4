import postcssPanda from '@pandacss/dev/postcss'
import { execSync } from 'node:child_process'
import { glob, readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/custom/index.ts',
    'src/styles-font.css',
    'src/styles-min.css',
    'src/styles-xyflow.css',
    'src/styles.css',
  ],
  unbundle: true,
  platform: 'neutral',
  inputOptions: {
    resolve: {
      mainFields: ['module', 'main'],
    },
  },
  minify: false,
  outputOptions: {
    keepNames: true,
    entryFileNames: '[name].mjs',
  },
  css: {
    minify: true,
    transformer: 'postcss',
    postcss: {
      plugins: [
        postcssPanda(),
      ],
    },
  },
  hooks: {
    'build:before': async (ctx) => {
      const { logger } = ctx.options
      logger.info('shipping panda')
      execSync('pnpm pandacss codegen', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
    },
    'build:done': async (ctx) => {
      const { logger } = ctx.options
      logger.info('shipping panda')
      execSync('pnpm pandacss ship --outfile ./panda.buildinfo.json', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })

      for await (const file of glob('dist/*.css')) {
        const content = await readFile(file, 'utf-8')
        if (content.includes(':where(:host')) {
          // validate result of styles build, should be ":where(:root,:host)" as
          // expected by shadowroot styles
          throw new Error(`Found ":where(:host" in ${file}, should be ":where(:root,:host)"`)
        }
        logger.info(`copy ${file} to ${basename(file)}`)
        await writeFile(basename(file), content)
      }
    },
  },
  // outputOptions: {
  //   entryFileNames: '[name].mjs',
  // },
})
