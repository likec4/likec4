/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CommandModule } from 'yargs'
import k from 'kleur'
import { resolve } from 'node:path'

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
        }
      })
      .coerce(['path', 'output'], resolve)
      .default('path', resolve('.'), '.')
      .default('output', resolve('./dist'), './dist')
      .example(
        `${k.green('$0 build -o ./build ./src')}`,
        k.gray("Search for likec4 files in 'src' and output static site to 'build'")
      ),
  handler: async args => {
    const { handler } = await import('./build')
    await handler(args)
  }
} satisfies CommandModule<object, { path: string; output: string }>

export default buildCmd
