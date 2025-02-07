import type { CommandModule } from 'yargs'
import { base, listenInterface, path, useDotBin, useHashHistory, useOverview, webcomponentPrefix } from '../options'
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
      .option('use-hash-history', useHashHistory)
      .option('use-overview', useOverview)
      .option('use-dot', useDotBin)
      .option('interface', listenInterface),
  handler: async args => {
    await handler({
      path: args.path,
      useDotBin: args['use-dot'],
      base: args.base,
      useOverview: args['use-overview'] ?? false,
      webcomponentPrefix: args['webcomponent-prefix'],
      useHashHistory: args['use-hash-history'],
      listenInterface: args['interface']
    })
  }
} satisfies CommandModule<object, {
  path: string
  'use-dot': boolean
  'use-hash-history': boolean | undefined
  base?: string | undefined
  'use-overview': boolean | undefined
  'webcomponent-prefix': string,
  'interface': string
}>
// } satisfies CommandModule<object, {
//   path: string
//   useDotBin: boolean
//   base: string | undefined
//   'webcomponent-prefix': string | undefined
// }>

export default serveCmd
