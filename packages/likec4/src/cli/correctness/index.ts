import type { CommandModule } from 'yargs'
import { path } from '../options'
import { handler } from './correctness'

export const correctnessCmd = {
  command: 'correctness [path]',
  aliases: [],
  describe: 'Run correctness checks on the architecture model',
  builder: yargs =>
    yargs
      .positional('path', path)
      .option('strict', {
        boolean: true,
        default: false,
        description: 'fail on warnings',
      }),
  handler: async args => {
    await handler({
      path: args.path,
      strict: args.strict,
    })
  },
} satisfies CommandModule<object, {
  path: string
  strict: boolean
}>

export default correctnessCmd
