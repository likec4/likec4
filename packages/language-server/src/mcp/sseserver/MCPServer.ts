import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express, { type Request, type Response } from 'express'
import type { AsyncDisposable } from 'langium'
import http from 'node:http'
import type { LikeC4Services } from '../../module'
import type { LikeC4MCPServer } from '../interfaces'
import { logger } from '../utils'

export class SSELikeC4MCPServer implements LikeC4MCPServer, AsyncDisposable {
  // Store transports by session ID to send notifications
  private transports: { [sessionId: string]: SSEServerTransport } = {}
  private server: http.Server | undefined = undefined

  private _port: number = 33335

  constructor(private services: LikeC4Services) {
  }

  get isStarted() {
    return this.server?.listening === true
  }

  get port() {
    return this._port
  }

  async dispose() {
    await this.stop()
  }

  async start(port = 33335): Promise<void> {
    if (this.server) {
      if (this.port === port) {
        return
      }
      await this.stop()
    }
    logger.info('Starting MCP server on port {port}', { port })
    this._port = port

    const mcp = this.services.mcp.ServerFactory.create()

    const app = express()
    app.get('/sse', async (_: Request, res: Response) => {
      const transport = new SSEServerTransport('/messages', res)
      this.transports[transport.sessionId] = transport
      logger.debug`SSE connection established, sessionId: ${transport.sessionId}`
      res.on('close', () => {
        delete this.transports[transport.sessionId]
      })
      await mcp.connect(transport)
    })

    app.post('/messages', async (req: Request, res: Response) => {
      const sessionId = req.query['sessionId'] as string
      const transport = this.transports[sessionId]
      if (transport) {
        logger.debug`SSE message received, sessionId: ${sessionId}`
        await transport.handlePostMessage(req, res)
      } else {
        res.status(400).send('No transport found for sessionId')
      }
    })

    return new Promise((resolve, reject) => {
      this.server = app.listen(this._port, (err) => {
        if (err) {
          reject(err)
          return
        }
        logger.info('MCP server listening on port {port}', { port: this._port })
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    this.transports = {}
    const server = this.server
    if (!server) {
      return
    }
    logger.info('Stopping MCP server')
    this.server = undefined
    return new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          logger.error('Failed to stop MCP server', { err })
        }
        logger.info('MCP server stopped')
        resolve()
      })
    })
  }
}
