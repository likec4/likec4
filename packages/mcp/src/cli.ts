#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import { resolve } from 'node:path'
import { startLikeC4MCP } from './index'
import { logger } from './utils'

const main = defineCommand({
  meta: {
    name: 'likec4-mcp-server',
    description: 'LikeC4 MCP server',
  },
  args: {
    stdio: {
      type: 'boolean',
      description: 'use stdio transport (default)',
      required: false,
    },
    http: {
      type: 'boolean',
      description: 'use streamable http transport',
      required: false,
    },
    port: {
      type: 'string',
      description: 'change http port',
      valueHint: 'number',
      required: false,
    },
    graphviz: {
      type: 'enum',
      options: ['binary', 'wasm'],
      description: 'use binary or wasm graphviz',
      default: 'wasm',
      required: false,
    },
    watch: {
      type: 'boolean',
      description: 'disable watch for changes',
      default: true,
      required: false,
    },
    workspace: {
      type: 'positional',
      description: 'change workspace, can be set by LIKEC4_WORKSPACE env',
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

    process.on('uncaughtException', (err) => {
      logger.error('uncaughtException', { err })
    })

    process.on('unhandledRejection', (err) => {
      logger.error('unhandledRejection', { err })
    })

    const port = args.port ? parseInt(args.port) : 33335
    const workspacePath = resolve(args.workspace || '.')

    if (args.watch) {
      logger.warn`watch for changes enabled, use ${'--no-watch'} to consume less resources`
    }

    await startLikeC4MCP({
      workspacePath,
      graphviz: args.graphviz,
      mcp: useStdio ? 'stdio' : { port },
      // Logger is already configured
      configureLogger: true,
      watch: args.watch,
    })
  },
})

runMain(main).catch(err => {
  logger.error(err)
  process.exit(1)
})
