import { resolve } from 'path'
import type { CommandModule } from 'yargs'

export const previewCmd = {
  command: 'preview [path]',
  describe: 'Start local server to preview production build',
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
      .default('output', resolve('./dist'), './dist'),
  async handler(args) {
    const { handler } = await import('./preview')
    await handler(args)
  }
} satisfies CommandModule<object, { path: string; output: string }>

export default previewCmd
