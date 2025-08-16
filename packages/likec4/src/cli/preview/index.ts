import { resolve } from 'path'
import type * as yargs from 'yargs'
import { handler } from './preview'

const previewCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'preview [path]',
      describe: 'Start local server to preview production build',
      builder: yargs =>
        yargs
          .positional('path', {
            type: 'string',
            desc: 'Directory with LikeC4 source files\nif not specified search in current directory',
            normalize: true,
          })
          .options({
            output: {
              alias: 'o',
              type: 'string',
              desc: 'output directory from production build',
              normalize: true,
            },
            base: {
              type: 'string',
              desc: 'base url the app is being served from',
            },
            'listen': {
              alias: 'l',
              type: 'string',
              desc: 'ip address of the network interface to listen on',
            },
          })
          .coerce(['path', 'output'], resolve)
          .default('path', resolve('.'), '.')
          .default('listen', '127.0.0.1', 'localhost'),

      handler: async args => {
        await handler(args)
      },
    })
}

export default previewCmd
