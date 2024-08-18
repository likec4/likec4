import type { CommandModule } from 'yargs'
import { base, path, skipPreviews, useDotBin, useHashHistory, webcomponentPrefix } from '../options'
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
      .option('skip-previews', skipPreviews)
      .option('use-dot', useDotBin),
  handler: async args => {
    await handler({
      path: args.path,
      useDotBin: args['use-dot'],
      base: args.base,
      skipPreviews: args['skip-previews'] ?? false,
      webcomponentPrefix: args['webcomponent-prefix'],
      useHashHistory: args['use-hash-history']
    })
  }
} satisfies CommandModule<object, {
  path: string
  'use-dot': boolean
  'use-hash-history': boolean | undefined
  base?: string | undefined
  'skip-previews': boolean | undefined
  'webcomponent-prefix': string
}>
// } satisfies CommandModule<object, {
//   path: string
//   useDotBin: boolean
//   base: string | undefined
//   'webcomponent-prefix': string | undefined
// }>

export default serveCmd
