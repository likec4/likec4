#!/usr/bin/env node

import { createLanguageServices, WithFileSystem, WithLikeC4ManualLayouts, WithMCPServer } from '@likec4/language-server'
import {
  configureLogger,
  getAnsiColorFormatter,
  getConsoleStderrSink,
  logger,
} from '@likec4/log'
import { defineCommand, runMain } from 'citty'
import { resolve } from 'node:path'
import { isColorSupported } from 'std-env'
import { URI } from 'vscode-uri'

const main = defineCommand({
  meta: {
    name: 'likec4-mcp-server',
    description: 'LikeC4 MCP server',
  },
  args: {
    stdio: {
      type: 'boolean',
      description: 'use stdio transport (this is default)',
      required: false,
    },
    http: {
      type: 'boolean',
      description: 'use streamable http transport',
      required: false,
    },
    port: {
      type: 'string',
      description: 'change http port (default: 33335)',
      valueHint: 'number',
      required: false,
    },
    watch: {
      type: 'boolean',
      description: 'disable watch for changes (consume less resources if you have static workspace)',
      default: true,
      required: false,
    },
    workspace: {
      type: 'positional',
      description: 'change workspace, defaults to current directory, can be set by LIKEC4_WORKSPACE env',
      valueHint: 'directory',
      required: false,
      default: process.env['LIKEC4_WORKSPACE'] || '.',
    },
  },
  setup({ args }) {
    if (args.stdio && (args.http || args.port)) {
      throw new Error('stdio and http are mutually exclusive')
    }
  },
  async run({ args }) {
    const useStdio = args.stdio || (!args.http && !args.port)

    configureLogger({
      sinks: {
        console: getConsoleStderrSink(
          isColorSupported && !useStdio ? { formatter: getAnsiColorFormatter() } : undefined,
        ),
      },
    })
    process.on('uncaughtException', (err) => {
      logger.error('uncaughtException', { err })
    })

    process.on('unhandledRejection', (err) => {
      logger.error('unhandledRejection', { err })
    })

    const port = args.port ? parseInt(args.port) : 33335
    const workspace = resolve(args.workspace || '.')
    logger.info`Loading LikeC4 from workspace: ${workspace}`

    if (args.watch) {
      logger.warn`watch for changes enabled, use ${'--no-watch'} to consume less resources`
    }

    const langium = createLanguageServices({
      ...WithFileSystem(args.watch),
      ...WithLikeC4ManualLayouts,
      ...WithMCPServer(useStdio ? 'stdio' : { port }),
    })

    await langium.shared.workspace.WorkspaceManager.initializeWorkspace([{
      uri: URI.file(workspace).toString(),
      name: 'workspace',
    }])

    await langium.likec4.mcp.Server.start()
  },
})

runMain(main).catch(err => {
  logger.error(err)
  process.exit(1)
})
