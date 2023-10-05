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
      .coerce('path', resolve)
      .default('path', resolve('.'), '.'),
  handler: async args => {
    const { handler } = await import('./serve')
    await handler(args)
  }
} satisfies CommandModule<object, { path: string }>

export default serveCmd
