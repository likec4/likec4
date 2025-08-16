import type * as yargs from 'yargs'
import { ensureReact } from '../ensure-react'
import { base, listen, path, title, useDotBin, useHashHistory, webcomponentPrefix } from '../options'
import { handler } from './serve'

const serveCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'start [path]',
      aliases: ['serve', 'dev'],
      describe: 'Start local dev server to preview LikeC4 views',
      builder: yargs =>
        yargs
          .positional('path', path)
          .option('base', base)
          .option('webcomponent-prefix', webcomponentPrefix)
          .option('title', title)
          .option('use-hash-history', useHashHistory)
          // .option('use-overview', useOverview)
          .option('use-dot', useDotBin)
          .option('listen', listen),
      handler: async args => {
        await ensureReact()
        await handler({
          path: args.path,
          useDotBin: args['use-dot'],
          base: args.base,
          // useOverview: args['use-overview'] ?? false,
          webcomponentPrefix: args['webcomponent-prefix'],
          title: args['title'],
          useHashHistory: args['use-hash-history'],
          listen: args['listen'],
        })
      },
    })
}

export default serveCmd
