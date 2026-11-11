import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { resolveAppConfig } from '../../app-config'
import { createLikeC4Logger } from '../../logger'
import { relativeToCwd } from '../../vite/utils'
import { notifyAvailableUpdate } from '../check-update/utils'
import { ensureReact } from '../ensure-libs'
import {
  allowedHost,
  appConfig,
  base,
  customization,
  hmrPort,
  listen,
  path,
  port,
  publicDir,
  theme,
  title,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
  withoutDefault,
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
          .positional('path', withoutDefault(path))
          .option('app-config', appConfig)
          .option('base', base)
          .option('webcomponent-prefix', withoutDefault(webcomponentPrefix))
          .option('title', withoutDefault(title))
          .option('theme', theme)
          .option('customization', customization)
          .option('use-hash-history', useHashHistory)
          .option('use-dot', withoutDefault(useDotBin))
          .option('listen', withoutDefault(listen))
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
              defaultDescription: 'true',
              describe: 'Enable/Disable Webcomponent build',
            },
          }),
      handler: async args => {
        await notifyAvailableUpdate()
        // Show support message after 5 seconds
        setTimeout(showSupportUsMessage, 5000).unref()

        await ensureReact()

        const config = await resolveAppConfig({
          appConfig: args['app-config'],
          path: args.path,
          useDot: args['use-dot'],
          base: args.base,
          title: args.title,
          theme: args.theme,
          useHashHistory: args['use-hash-history'],
          webcomponentPrefix: args['webcomponent-prefix'],
          customization: args.customization,
          publicDir: args.public,
          buildWebcomponent: args['build-webcomponent'],
          listen: args.listen,
          port: args.port,
          hmrPort: args['hmr-port'],
          allowedHosts: args['allowed-host'],
        })
        if (config.configFile) {
          createLikeC4Logger('c4:start').info(`${k.cyan('app config')} ${k.dim(relativeToCwd(config.configFile))}`)
        }

        await handler({
          path: config.workspace,
          useDotBin: config.graphviz === 'binary',
          base: config.base,
          webcomponentPrefix: config.webcomponentPrefix,
          title: config.title,
          theme: config.theme,
          customization: config.customization,
          appConfigFile: config.configFile,
          useHashHistory: config.useHashHistory,
          listen: config.server.host,
          port: config.server.port,
          hmrPort: config.server.hmrPort,
          enableHMR: args['react-hmr'],
          enableWebcomponent: config.build.webcomponent,
          userPublicDir: config.publicDir,
          allowedHosts: config.server.allowedHosts,
        })
      },
    })
}

export default serveCmd
