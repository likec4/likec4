import type { HttpBindings, ServerType } from '@hono/node-server'
import { serve } from '@hono/node-server'
import { loggable } from '@likec4/log'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AsyncDisposable } from 'langium'
import { nanoid } from 'nanoid'
import type { LikeC4Services } from '../../module'
import type { LikeC4MCPServer, LikeC4MCPServerFactory } from '../types'
import { logger } from '../utils'

type Bindings = HttpBindings & {
  /* ... */
}

async function createHonoApp(factory: LikeC4MCPServerFactory) {
  const mcp = factory.create()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => nanoid(),
  })
  const app = new Hono<{ Bindings: Bindings }>()

  // Enable CORS for all origins
  app.use(
    '*',
    cors({
      origin: '*',
      allowHeaders: ['Content-Type', 'mcp-session-id', 'Last-Event-ID', 'mcp-protocol-version'],
      exposeHeaders: ['mcp-session-id', 'mcp-protocol-version'],
    }),
  )

  // Health check endpoint
  app.get('/health', c => c.json({ status: 'ok' }))

  // MCP endpoint
  app.all('/mcp', c => transport.handleRequest(c.req.raw))

  app.notFound((c) => {
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

  app.onError((e, c) => {
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

  await mcp.connect(transport)

  return app
}

async function startServer(params: {
  factory: LikeC4MCPServerFactory
  port: number
}): Promise<ServerType> {
  const { factory, port } = params
  const app = await createHonoApp(factory)
  return new Promise((resolve, reject) => {
    const server = serve({
      fetch: app.fetch,
      hostname: '0.0.0.0',
      port,
    })
      .prependOnceListener('error', reject)
      .prependOnceListener('listening', () => {
        server.removeListener('error', reject)
        resolve(server.unref())
      })
  })
}

export class StreamableLikeC4MCPServer implements LikeC4MCPServer, AsyncDisposable {
  // Store transports by session ID to send notifications
  private server: ServerType | undefined = undefined

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
    if (this.server) {
      if (this.port === port) {
        return
      }
      await this.stop()
    }
    logger.info('Starting MCP server on port {port}', { port })
    this._port = port
    this.server = await startServer({
      factory: this.services.mcp.ServerFactory,
      port,
    })
    logger.info('MCP server ready at http://0.0.0.0:{port}/mcp', { port })
  }

  stop(): Promise<void> {
    const server = this.server
    if (!server) {
      logger.info('MCP server is not running, nothing to stop')
      return Promise.resolve()
    }
    logger.info('Stopping MCP server')
    this.server = undefined
    return new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          logger.error('Failed to stop MCP server', { err })
        } else {
          logger.info('MCP server stopped')
        }
        resolve()
      })
    })
  }
}
