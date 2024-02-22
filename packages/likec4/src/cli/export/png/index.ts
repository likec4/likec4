import { resolve } from 'path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'
import { useDotBin } from '../../options'

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
        },
        useDotBin
      })
      .coerce(['path', 'output'], resolve)
      .default('path', resolve('.'), '.')
      .default('output', resolve('.'), '.').epilog(`${k.bold('Examples:')}
  ${k.green('$0 export png')}
    ${k.gray('Search for likec4 files in current directory and output PNG next to sources')}

  ${k.green('$0 export png -o ./generated src/likec4 ')}
    ${k.gray('Search for likec4 files in src/likec4 and output PNG next to generated')}
`)
  },
  async handler(args) {
    const { handler } = await import('./handler')
    await handler(args)
  }
} satisfies CommandModule<unknown, { path: string; output: string; useDotBin: boolean }>

export default exportPngCmd
