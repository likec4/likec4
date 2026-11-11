import { nodeModulesCodeSplitting } from '@likec4/devops/tsdown'
import postcssPanda from '@pandacss/dev/postcss'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { glob, readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { viteAliasPlugin } from 'rolldown/experimental'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/**/*.tsx',
    // 'src/routes/**/*.tsx',
    'codegen/*.tsx',
    '!**/*.spec.tsx',
    '!**/*.spec.ts',
    'src/fonts.css',
    'src/style.css',
  ],
  // unbundle: true,
  platform: 'browser',
  dts: false,
  deps: {
    neverBundle: [
      'likec4/react',
      /^likec4(:|\/).+$/,
    ],
  },
  inputOptions: {
    resolve: {
      // alias: {
      //   '@likec4/diagram/custom': 'likec4/react',
      //   '@likec4/diagram': 'likec4/react',
      // },
      // mainFields: ['module', 'main'],
    },
  },
  minify: false,
  outputOptions: {
    keepNames: true,
    // entryFileNames: '[name].mjs',
    // chunkFileNames: 'chunks/[name].mjs',
    codeSplitting: {
      groups: [
        nodeModulesCodeSplitting({
          minShareCount: 2,
          minSize: 10 * 1024,
        }),
      ],
    },
  },
  css: {
    minify: true,
    transformer: 'postcss',
    splitting: true,
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
  plugins: [
    viteAliasPlugin({
      entries: [
        { find: '@likec4/diagram/custom', replacement: 'likec4/react' },
        { find: '@likec4/diagram', replacement: 'likec4/react' },
      ],
    }),
    react({
      compiler: true,
    }),
  ],
  // outputOptions: {
  //   entryFileNames: '[name].mjs',
  // },
})
