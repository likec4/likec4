import { resolve } from 'path'
import type { CommandModule } from 'yargs'
import { handler } from './preview'

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
          desc: 'output directory from production build',
          normalize: true
        },
        base: {
          type: 'string',
          desc: 'base url the app is being served from'
        },
        'interface': {
          alias: 'i',
          type: 'string',
          desc: 'ip address of the network interface to listen on'
        }
      })
      .coerce(['path', 'output'], resolve)
      .default('path', resolve('.'), '.')
      .default('interface', '127.0.0.1', 'localhost'),

  async handler(args) {
    await handler(args)
  }
} satisfies CommandModule<
  object,
  { path: string; output?: string | undefined; base?: string | undefined }
>

export default previewCmd
