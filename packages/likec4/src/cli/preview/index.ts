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
        }
      })
      .coerce(['path', 'output'], resolve)
      .default('path', resolve('.'), '.'),

  async handler(args) {
    await handler(args)
  }
} satisfies CommandModule<
  object,
  { path: string; output?: string | undefined; base?: string | undefined }
>

export default previewCmd
