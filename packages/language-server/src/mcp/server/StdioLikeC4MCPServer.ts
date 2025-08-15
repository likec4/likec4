import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { AsyncDisposable } from 'langium'
import type { LikeC4Services } from '../../module'
import type { LikeC4MCPServer } from '../interfaces'
import { logger } from '../utils'

export class StdioLikeC4MCPServer implements LikeC4MCPServer, AsyncDisposable {
  private transport: StdioServerTransport | undefined = undefined
  private _mcp: McpServer | undefined = undefined

  constructor(private services: LikeC4Services) {
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
    return 0
  }

  async dispose() {
    await this.stop()
  }

  async start(): Promise<void> {
    if (this.transport) {
      return
    }
    logger.info('Starting MCP stdio server')
    this._mcp = this.services.mcp.ServerFactory.create()
    this.transport = new StdioServerTransport()
    await this._mcp.connect(this.transport)
    logger.info('LikeC4 MCP Server running on stdio')
  }

  async stop(): Promise<void> {
    if (!this.transport) {
      return
    }
    logger.info('Stopping MCP stdio server')
    await this.transport.close()
    this._mcp?.close()
    this.transport = undefined
  }
}
