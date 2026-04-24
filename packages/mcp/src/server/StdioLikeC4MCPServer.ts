import type { LikeC4LanguageServices } from '@likec4/language-server'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { AsyncDisposable } from 'langium'
import { setMcpServerCtx } from '../ctx'
import { logger } from '../utils'
import { createMCPServer } from './createMCPServer'

export interface LikeC4MCPServer {
  readonly mcp: McpServer
  readonly isStarted: boolean
  readonly port: number
  start(port?: number): Promise<void>
  stop(): Promise<void>
}

export class StdioLikeC4MCPServer implements LikeC4MCPServer, AsyncDisposable {
  private transport: StdioServerTransport | undefined = undefined
  private _mcp: McpServer | undefined = undefined

  constructor(private services: LikeC4LanguageServices) {
  }

  get mcp(): McpServer {
    if (!this._mcp) {
      throw new Error('MCP server is not started')
    }
    return this._mcp
  }

  get isStarted() {
    return this.transport !== undefined
  }

  get port() {
    return NaN
  }

  async dispose() {
    await this.stop()
  }

  async start(): Promise<void> {
    if (this.transport) {
      return
    }
    logger.info('Starting MCP stdio server')
    this._mcp = createMCPServer(this.services)
    setMcpServerCtx(this._mcp)
    this.transport = new StdioServerTransport()
    await this._mcp.connect(this.transport)
    logger.info('LikeC4 MCP Server running on stdio')
  }

  async stop(): Promise<void> {
    if (!this.transport) {
      return
    }
    try {
      logger.info('Stopping MCP stdio server')
      await this.transport.close()
      if (this._mcp) {
        await this._mcp.close()
      }
    } finally {
      this._mcp = undefined
      this.transport = undefined
      setMcpServerCtx(undefined)
    }
  }
}
