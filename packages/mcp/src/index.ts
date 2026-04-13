#!/usr/bin/env node

import { configureLanguageServerLogger } from '@likec4/language-server'
import { type LikeC4, fromWorkspace } from '@likec4/language-services/node'
import { defu } from 'defu'
import { resolve } from 'node:path'
import { isDevelopment } from 'std-env'
import k from 'tinyrainbow'
import { StdioLikeC4MCPServer } from './server/StdioLikeC4MCPServer'
import { StreamableLikeC4MCPServer } from './server/StreamableLikeC4MCPServer'
import { logger } from './utils'

export interface FromWorkspaceOptions {
  /**
   * Path to workspace with LikeC4 sources
   * @default current working directory
   */
  workspacePath?: string
  /**
   * Whether to start MCP server
   * @default 'stdio' (use stdio transport), set to { port: number } to use streamable http transport
   */
  mcp?: 'stdio' | { port: number }
  /**
   * Whether to configure the logger. Set this to false if you want to configure the logger yourself before calling `fromWorkspace`.
   * @default true
   */
  configureLogger?: boolean
  /**
   * Whether to watch for changes in the workspace.
   * @default true
   */
  watch?: boolean

  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * Whether to throw an error if no LikeC4 sources are found in the workspace.
   * @default false
   */
  throwIfInvalid?: boolean
}

/**
 * Start LikeC4 MCP server from a workspace
 *
 * @param workspacePath path to workspace with LikeC4 sources
 */
export async function initLikeC4MCP(
  options?: FromWorkspaceOptions,
): Promise<{
  server: StdioLikeC4MCPServer | StreamableLikeC4MCPServer
  likec4: LikeC4
}> {
  const opts = defu(
    options,
    {
      workspacePath: '.',
      mcp: 'stdio',
      graphviz: 'wasm',
      watch: true,
      throwIfInvalid: false,
      configureLogger: true,
    } satisfies FromWorkspaceOptions,
  )

  if (opts.configureLogger) {
    configureLanguageServerLogger({
      useStdErr: opts.mcp === 'stdio',
      colors: k.isColorSupported && opts.mcp !== 'stdio',
      logLevel: isDevelopment ? 'debug' : 'info',
    })

    process.on('uncaughtException', (err) => {
      logger.error('uncaughtException', { err })
    })

    process.on('unhandledRejection', (err) => {
      logger.error('unhandledRejection', { err })
    })
  }

  const workspace = resolve(opts.workspacePath)
  logger.info`Loading LikeC4 from workspace: ${workspace}`

  const likec4 = await fromWorkspace(workspace, {
    graphviz: opts.graphviz,
    manualLayouts: true,
    // Logger is already configured
    configureLogger: false,
    watch: opts.watch,
    throwIfInvalid: opts.throwIfInvalid,
  })

  const services = likec4.languageServices

  let server = opts.mcp === 'stdio'
    ? new StdioLikeC4MCPServer(services)
    : new StreamableLikeC4MCPServer(services, opts.mcp.port)

  return {
    server,
    likec4,
  }
}

export async function startLikeC4MCP(options?: FromWorkspaceOptions): Promise<{
  server: StdioLikeC4MCPServer | StreamableLikeC4MCPServer
  likec4: LikeC4
}> {
  const initiated = await initLikeC4MCP(options)
  await initiated.server.start()
  return initiated
}
