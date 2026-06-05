import type * as yargs from 'yargs'
import { notifyAvailableUpdate } from '../check-update/utils'
import { ensureReact } from '../ensure-libs'
import {
  allowedHost,
  base,
  hmrPort,
  listen,
  path,
  port,
  publicDir,
  title,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
} from '../options'
import { showSupportUsMessage } from '../support-message'
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
          .option('use-dot', useDotBin)
          .option('listen', listen)
          .option('port', port)
          .option('hmr-port', hmrPort)
          .option('public', publicDir)
          .option('allowed-host', allowedHost)
          .options({
            'react-hmr': {
              type: 'boolean',
              default: true,
              describe: 'Enable/Disable React HMR',
            },
            'build-webcomponent': {
              type: 'boolean',
              default: true,
              describe: 'Enable/Disable Webcomponent build',
            },
          }),
      handler: async args => {
        await notifyAvailableUpdate()
        // Show support message after 5 seconds
        setTimeout(showSupportUsMessage, 5000).unref()

        await ensureReact()
        await handler({
          path: args.path,
          useDotBin: args['use-dot'],
          base: args.base,
          webcomponentPrefix: args['webcomponent-prefix'],
          title: args['title'],
          useHashHistory: args['use-hash-history'],
          listen: args['listen'],
          port: args['port'],
          hmrPort: args['hmr-port'],
          enableHMR: args['react-hmr'],
          enableWebcomponent: args['build-webcomponent'],
          userPublicDir: args.public,
          allowedHosts: args['allowed-host'],
        })
      },
    })
}

export default serveCmd
