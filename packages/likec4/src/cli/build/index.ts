/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import {
  base,
  outputSingleFile,
  path,
  title,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
} from '../options'
import { buildHandler as handler } from './build'

const buildCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'build [path]',
      aliases: ['bundle'],
      describe: 'Build a static website',
      builder: yargs =>
        yargs
          .positional('path', path)
          .option('output', {
            alias: 'o',
            type: 'string',
            desc: 'output directory for production build',
            normalize: true,
            coerce: resolve,
          })
          .option('base', base)
          .option('use-hash-history', useHashHistory)
          .option('use-dot', useDotBin)
          .option('webcomponent-prefix', webcomponentPrefix)
          .option('title', title)
          // .option('use-overview', useOverview)
          .option('output-single-file', outputSingleFile)
          .example(
            `${k.green('$0 build -o ./build ./src')}`,
            k.gray('Search for likec4 files in \'src\' and output static site to \'build\''),
          ),
      handler: async (args) => {
        await handler({
          path: args.path,
          output: args.output,
          base: args.base,
          useHashHistory: args['use-hash-history'],
          useDotBin: args['use-dot'],
          // useOverview: args['use-overview'] ?? false,
          webcomponentPrefix: args['webcomponent-prefix'],
          title: args.title,
          outputSingleFile: args['output-single-file'] ?? false,
        })
      },
    })
}
export default buildCmd
