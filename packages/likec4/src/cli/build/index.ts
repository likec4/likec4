/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type { CommandModule } from 'yargs'
import { base, outputSingleFile, path, useDotBin, useHashHistory, useOverview, webcomponentPrefix } from '../options'
import { buildHandler as handler } from './build'

export const buildCmd = {
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
      .option('use-overview', useOverview)
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
      useOverview: args['use-overview'] ?? false,
      webcomponentPrefix: args['webcomponent-prefix'],
      outputSingleFile: args['output-single-file'] ?? false,
    })
  },
} satisfies CommandModule<object, {
  output: string | undefined
  path: string
  'use-dot': boolean
  base?: string | undefined
  'use-hash-history': boolean | undefined
  'use-overview': boolean | undefined
  'webcomponent-prefix': string
  'output-single-file': boolean | undefined
}>

export default buildCmd
