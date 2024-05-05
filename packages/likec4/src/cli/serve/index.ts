import type { CommandModule } from 'yargs'
import { base, path, useDotBin, webcomponentPrefix } from '../options'
import { handler } from './serve'

export const serveCmd = {
  command: 'start [path]',
  aliases: ['serve', 'dev'],
  describe: 'Start local dev server to preview LikeC4 views',
  builder: yargs =>
    yargs
      .positional('path', path)
      .option('base', base)
      .option('webcomponent-prefix', webcomponentPrefix)
      .option('use-dot-bin', useDotBin),
  handler: async args => {
    await handler({
      path: args.path,
      useDotBin: args['use-dot-bin'],
      base: args.base,
      webcomponentPrefix: args['webcomponent-prefix']
    })
  }
} satisfies CommandModule<object, {
  path: string
  'use-dot-bin': boolean
  base?: string | undefined
  'webcomponent-prefix': string
}>
// } satisfies CommandModule<object, {
//   path: string
//   useDotBin: boolean
//   base: string | undefined
//   'webcomponent-prefix': string | undefined
// }>

export default serveCmd
