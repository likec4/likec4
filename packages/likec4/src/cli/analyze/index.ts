import type { CommandModule } from 'yargs'
import { path } from '../options'
import { handler } from './analyze.js'

export const analyzeCmd = {
  command: 'analyze [path]',
  aliases: [],
  describe: 'Run capacity planning analysis on the architecture model',
  builder: yargs =>
    yargs
      .positional('path', path)
      .option('format', {
        string: true,
        default: 'table',
        choices: ['table', 'json', 'csv'],
        description: 'Output format for analysis results',
      })
      .option('detailed', {
        boolean: true,
        default: false,
        description: 'Show detailed calculation breakdown',
      }),
  handler: async args => {
    await handler({
      path: args.path,
      format: args.format,
      detailed: args.detailed,
    })
  },
} satisfies CommandModule<object, {
  path: string
  format: string
  detailed: boolean
}>
