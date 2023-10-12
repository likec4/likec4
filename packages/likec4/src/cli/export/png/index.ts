import k from 'picocolors'
import { resolve } from 'path'
import type { CommandModule } from 'yargs'

const exportPngCmd = {
  command: 'png [path]',
  describe: 'Export views to PNG',
  builder(yargs) {
    return yargs
      .usage(`${k.bold('Usage:')} $0 export png [path]`)
      .positional('path', {
        type: 'string',
        desc: 'Directory with LikeC4 source files\nif not specified search in current directory',
        normalize: true
      })
      .options({
        output: {
          alias: 'o',
          type: 'string',
          desc: 'output directory',
          normalize: true
        }
      })
      .coerce(['path', 'output'], resolve)
      .default('path', resolve('.'), '.')
      .default('output', resolve('.'), '.')
      .example(
        `${k.green('$0 export png')}`,
        k.gray('Search for likec4 files in current directory and output PNG next to sources')
      )
      .example(
        `${k.green('$0 export png -o ./generated src/likec4 ')}`,
        k.gray('Search for likec4 files in $PWD/src/likec4 and output PNG next to $PWD/generated')
      )
  },
  async handler(args) {
    const { handler } = await import('./handler')
    await handler(args)
  }
} satisfies CommandModule<unknown, { path: string; output: string }>

export default exportPngCmd
