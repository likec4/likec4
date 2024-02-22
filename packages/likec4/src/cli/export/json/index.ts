import { resolve } from 'path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'
import { useDotBin } from '../../options'

const exportJsonCmd = {
  command: 'json [path]',
  describe: 'Export model to JSON',
  builder(yargs) {
    return yargs
      .usage(`${k.bold('Usage:')} $0 export json [path]`)
      .positional('path', {
        type: 'string',
        desc: 'Directory with LikeC4 source files\nif not specified search in current directory',
        normalize: true
      })
      .options({
        outfile: {
          alias: 'o',
          type: 'string',
          desc: '<file> output .json file',
          normalize: true
        },
        useDotBin
      })
      .coerce(['path', 'outfile'], resolve)
      .default('path', resolve('.'), '.')
      .default('outfile', resolve('./likec4.json'), 'likec4.json').epilog(`${k.bold('Examples:')}
  ${k.green('$0 export json')}
    ${k.gray('Search for likec4 files in current directory and output JSON to likec4.json')}

  ${k.green('$0 export json -o ./generated/likec4.json src/likec4 ')}
    ${k.gray('Search for likec4 files in src/likec4 and output JSON to generated/likec4.json')}
`)
  },
  async handler(args) {
    const { handler } = await import('./handler')
    await handler(args)
  }
} satisfies CommandModule<unknown, { path: string; useDotBin: boolean; outfile: string }>

export default exportJsonCmd
