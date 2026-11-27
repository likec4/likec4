#!/usr/bin/env -S pnpm tsx

import { resolve } from 'node:path'
import { fromWorkspace } from '@likec4/language-services/node'
import { defineCommand, runMain } from 'citty'
import { resolveAppConfig, startDev } from './vite'
import { appFromSources } from './vite/sources'

const main = defineCommand({
  meta: {
    name: 'likec4-spa',
    description: 'LikeC4 SPA Development CLI',
  },
  args: {
    workspace: {
      type: 'positional',
      valueHint: 'dir',
      description: 'likec4 source directory',
      required: false,
    },
    project: {
      alias: 'p',
      type: 'string',
      valueHint: 'id',
      description: 'limit to these projects (comma-separated ids)',
      required: false,
    },
    customization: {
      type: 'string',
      valueHint: 'file',
      description: 'file with UI customizations (default export of defineCustomComponents)',
      required: false,
    },
    appConfig: {
      type: 'string',
      valueHint: 'file',
      description: 'LikeC4 app config (by default likec4.app.config.* in the workspace)',
      required: false,
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      description: 'verbose output',
      default: false,
    },
  },
  async run(context) {
    process.env['NODE_ENV'] = 'development'

    const config = await resolveAppConfig({
      appConfig: context.args.appConfig,
      path: resolve(context.args.workspace || '../../examples/'),
      customization: context.args.customization ? resolve(context.args.customization) : undefined,
    })
    const includeProjects = context.args.project
      ?.split(',')
      .map(id => id.trim())
      .filter(Boolean)

    const likec4 = await fromWorkspace(config.workspace, {
      ...(includeProjects && includeProjects.length > 0 && { includeProjects }),
      graphviz: config.graphviz,
      configureLogger: 'console',
      logLevel: context.args.verbose ? 'trace' : 'debug',
      watch: true,
    })

    const server = await startDev({
      app: appFromSources(),
      likec4,
      ai: 'disabled',
      openBrowser: false,
      base: config.base,
      title: config.title,
      theme: config.theme,
      useHashHistory: config.useHashHistory,
      webcomponentPrefix: config.webcomponentPrefix,
      customization: config.customization,
      userPublicDir: config.publicDir,
      listen: config.server.host,
      port: config.server.port,
      hmrPort: config.server.hmrPort,
      allowedHosts: config.server.allowedHosts,
    })

    console.log('')
    server.printUrls()
    console.log('')

    process.on('SIGINT', () => {
      Promise.all([server.close(), likec4.dispose()]).then(() => {
        process.exit(0)
      }).catch((error) => {
        console.error('Error stopping server:', error)
        process.exit(1)
      })
    })
  },
})

void runMain(main)
