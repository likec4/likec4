import type { CommandModule } from 'yargs'
import { path } from '../options'
import { handler } from './validate'

export const validateCmd = {
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
} satisfies CommandModule<object, {
  path: string
  'ignore-layout': boolean
}>

export default validateCmd
