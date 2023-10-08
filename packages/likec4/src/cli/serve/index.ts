import { resolve } from 'path'
import type { CommandModule } from 'yargs'

export const serveCmd = {
  command: 'serve [path]',
  aliases: ['start', 'dev'],
  describe: 'Start local dev server to preview LikeC4 diagrams',
  builder: yargs =>
    yargs
      .positional('path', {
        type: 'string',
        desc: 'Directory with LikeC4 source files\nif not specified search in current directory',
        normalize: true
      })
      .options({
        'source-maps': {
          type: 'boolean',
          desc: 'Enable source maps',
          default: false
        }
      })
      .hide('source-maps') //we use it at dev only
      .coerce('path', resolve)
      .default('path', resolve('.'), '.'),
  handler: async args => {
    const { handler } = await import('./serve')
    await handler(args)
  }
} satisfies CommandModule<object, { 'path': string; 'source-maps': boolean }>

export default serveCmd
