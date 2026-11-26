import { resolve } from 'node:path'
import type * as yargs from 'yargs'
import { appConfig, base, path, withoutDefault } from '../options'
import { handler } from './preview'

const previewCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'preview [path]',
      describe: 'Start local server to preview production build',
      builder: yargs =>
        yargs
          .positional('path', withoutDefault(path))
          .option('app-config', appConfig)
          .option('output', {
            alias: 'o',
            type: 'string',
            desc: 'output directory from production build',
            normalize: true,
            coerce: resolve,
          })
          .option('base', base)
          .option('listen', {
            alias: 'l',
            type: 'string',
            desc: 'ip address of the network interface to listen on',
            default: '127.0.0.1',
            defaultDescription: 'localhost',
          }),

      handler: async args => {
        await handler({
          appConfig: args['app-config'],
          path: args.path,
          output: args.output,
          base: args.base,
          listen: args.listen,
        })
      },
    })
}

export default previewCmd
