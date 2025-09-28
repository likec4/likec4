import type { HttpBindings } from '@hono/node-server'
import { serve } from '@hono/node-server'
import { promiseNextTick } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { toFetchResponse, toReqRes } from 'fetch-to-node'
import { Hono } from 'hono'
import type { AsyncDisposable } from 'langium'
import type { Server } from 'node:http'
import type { LikeC4Services } from '../../module'
import type { LikeC4MCPServer } from '../interfaces'
import { logger } from '../utils'

type Bindings = HttpBindings & {
  /* ... */
}

export class StreamableLikeC4MCPServer implements LikeC4MCPServer, AsyncDisposable {
  // Store transports by session ID to send notifications
  private server: Server | undefined = undefined

  constructor(
    private services: LikeC4Services,
    private _port: number = 33335,
  ) {
  }

  get mcp(): McpServer {
    throw new Error('StreamableLikeC4MCPServer has access to McpServer only during the request')
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

  async start(port = this._port): Promise<void> {
    try {
      if (this.server) {
        if (this.port === port) {
          return
        }
        await this.stop()
      }
      logger.info('Starting MCP server on port {port}', { port })
      this._port = port

      await promiseNextTick()

      const app = new Hono<{ Bindings: Bindings }>()
        .post('/mcp', async (c) => {
          const { req, res } = toReqRes(c.req.raw)

          const server = this.services.mcp.ServerFactory.create()

          try {
            const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
              sessionIdGenerator: undefined,
            })

            // Added for extra debuggability
            transport.onerror = (err) => {
              logger.error(loggable(err))
            }

            await server.connect(transport)

            await transport.handleRequest(req, res, await c.req.json())

            res.on('close', () => {
              logger.debug('Request closed')
              transport.close()
              server.close()
            })

            return toFetchResponse(res)
          } catch (e) {
            logger.error(loggable(e))
            return c.json(
              {
                jsonrpc: '2.0',
                error: {
                  code: -32603,
                  message: 'Internal server error',
                },
                id: null,
              },
              { status: 500 },
            )
          }
        })
        .get('/mcp', async (c) => {
          logger.debug('Received GET MCP request')
          return c.json(
            {
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Method not allowed.',
              },
              id: null,
            },
            { status: 405 },
          )
        })
        .delete('/mcp', async (c) => {
          logger.debug('Received DELETE MCP request')
          return c.json(
            {
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Method not allowed.',
              },
              id: null,
            },
            { status: 405 },
          )
        })
        .notFound((c) => {
          logger.debug(`${c.req.method} ${c.req.url} not found`)
          return c.json(
            {
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Method not found.',
              },
              id: null,
            },
            { status: 404 },
          )
        })
        .onError((e, c) => {
          logger.error(loggable(e))
          return c.json(
            {
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: 'Internal server error',
              },
              id: null,
            },
            { status: 500 },
          )
        })

      this.server = serve(
        {
          fetch: app.fetch,
          hostname: '0.0.0.0',
          port: this._port,
        },
        (info) => logger.info('MCP server ready at http://0.0.0.0:{port}/mcp', { port: info.port }),
      ) as Server
    } catch (err) {
      logger.warn('Failed to start MCP server', { err })
      return Promise.reject(err)
    }
  }

  stop(): Promise<void> {
    const server = this.server
    if (!server) {
      return Promise.resolve()
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
