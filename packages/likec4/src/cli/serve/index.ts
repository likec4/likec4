import { resolve } from 'path'
import type { CommandModule } from 'yargs'
import { useDotBin } from '../options'

export const serveCmd = {
  command: 'start [path]',
  aliases: ['serve', 'dev'],
  describe: 'Start local dev server to preview LikeC4 diagrams',
  builder: yargs =>
    yargs
      .positional('path', {
        type: 'string',
        desc: 'Directory with LikeC4 source files\nif not specified search in current directory',
        normalize: true
      })
      .options({
        base: {
          type: 'string',
          desc: 'base url the app is being served from'
        },
        useDotBin
      })
      .coerce('path', resolve)
      .default('path', resolve('.'), '.'),
  handler: async args => {
    const { handler } = await import('./serve')
    await handler(args)
  }
} satisfies CommandModule<object, { path: string; useDotBin: boolean; base: string | undefined }>

export default serveCmd
