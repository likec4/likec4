/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from 'node:path'
import k from 'picocolors'
import type { CommandModule } from 'yargs'
import { base, path, useDotBin, webcomponentPrefix } from '../options'
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
        coerce: resolve
      })
      .option('base', base)
      .option('webcomponent-prefix', webcomponentPrefix)
      .option('use-dot-bin', useDotBin)
      .example(
        `${k.green('$0 build -o ./build ./src')}`,
        k.gray('Search for likec4 files in \'src\' and output static site to \'build\'')
      ),
  handler: async (args) => {
    await handler({
      path: args.path,
      output: args.output,
      base: args.base,
      useDotBin: args['use-dot-bin'],
      webcomponentPrefix: args['webcomponent-prefix']
    })
  }
} satisfies CommandModule<object, {
  output: string | undefined
  path: string
  'use-dot-bin': boolean
  base?: string | undefined
  'webcomponent-prefix': string
}>

export default buildCmd
