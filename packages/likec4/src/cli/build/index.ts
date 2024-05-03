/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from 'node:path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'
import { useDotBin } from '../options'
import { buildHandler } from './build'

export const buildCmd = {
  command: 'build [path]',
  aliases: ['bundle'],
  describe: 'Build LikeC4 diagrams into a static site',
  builder: yargs =>
    yargs
      .positional('path', {
        type: 'string',
        desc: 'Directory with LikeC4 source files\nif not specified search in current directory',
        normalize: true
      })
      .options({
        output: {
          alias: 'o',
          type: 'string',
          desc: 'output directory for production build',
          normalize: true
        },
        useDotBin,
        base: {
          type: 'string',
          desc: 'base url the app is being served from'
        }
      })
      .coerce(['path', 'output'], resolve)
      .default('path', resolve('.'), '.')
      .example(
        `${k.green('$0 build -o ./build ./src')}`,
        k.gray('Search for likec4 files in \'src\' and output static site to \'build\'')
      ),
  handler: async args => {
    await buildHandler(args)
  }
} satisfies CommandModule<
  object,
  {
    path: string
    useDotBin: boolean
    output: string | undefined
    base: string | undefined
  }
>

export default buildCmd
