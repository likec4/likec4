import type * as yargs from 'yargs'
import { path } from '../options'
import { handler } from './validate'

const validateCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'validate [path]',
      aliases: [],
      describe: 'Validate model syntax and manual layout',
      builder: yargs =>
        yargs
          .positional('path', path)
          .option('ignore-layout', {
            alias: ['skip-layout'],
            boolean: true,
            default: false,
            description: 'do not validate layout of views',
          }),
      handler: async args => {
        await handler({
          path: args.path,
          ignoreLayout: args['ignore-layout'],
        })
      },
    })
}

export default validateCmd
