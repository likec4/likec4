import { MemoryEventStore, StreamableHTTPTransport } from '@hono/mcp';
import { serve } from '@hono/node-server';
import { loggable } from '@likec4/log';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from '../utils';
async function createHonoApp(factory) {
    const app = new Hono();
    // Enable CORS for all origins
    app.use('*', cors({
        origin: '*',
        allowHeaders: ['Content-Type', 'mcp-session-id', 'Last-Event-ID', 'mcp-protocol-version'],
        exposeHeaders: ['mcp-session-id', 'mcp-protocol-version'],
    }));
    // Health check endpoint
    app.get('/health', c => c.json({ status: 'ok' }));
    const mcpServer = factory.create();
    // Initialize the transport
    const transport = new StreamableHTTPTransport({
        eventStore: new MemoryEventStore({}),
    });
    // MCP endpoint
    app.all('/mcp', async (c) => {
        if (!mcpServer.isConnected()) {
            // Connect the mcp with the transport
            await mcpServer.connect(transport);
        }
        return await transport.handleRequest(c);
    });
    app.notFound((c) => {
        logger.debug(`${c.req.method} ${c.req.url} not found`);
        return c.json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not found.',
            },
            id: null,
        }, { status: 404 });
    });
    app.onError((e, c) => {
        logger.error(loggable(e));
        return c.json({
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: 'Internal server error',
            },
            id: null,
        }, { status: 500 });
    });
    return app;
}
async function startServer(params) {
    const { factory, port } = params;
    const app = await createHonoApp(factory);
    return new Promise((resolve, reject) => {
        const server = serve({
            fetch: app.fetch,
            hostname: '0.0.0.0',
            port,
        })
            .prependOnceListener('error', reject)
            .prependOnceListener('listening', () => {
            server.removeListener('error', reject);
            resolve(server.unref());
        });
    });
}
export class StreamableLikeC4MCPServer {
    services;
    _port;
    // Store transports by session ID to send notifications
    server = undefined;
    constructor(services, _port = 33335) {
        this.services = services;
        this._port = _port;
    }
    get mcp() {
        throw new Error('StreamableLikeC4MCPServer has access to McpServer only during the request');
    }
    get isStarted() {
        return this.server?.listening === true;
    }
    get port() {
        return this._port;
    }
    async dispose() {
        await this.stop();
    }
    async start(port = this._port) {
        if (this.server) {
            if (this.port === port) {
                return;
            }
            await this.stop();
        }
        logger.info('Starting MCP server on port {port}', { port });
        this._port = port;
        this.server = await startServer({
            factory: this.services.mcp.ServerFactory,
            port,
        });
        logger.info('MCP server ready at http://0.0.0.0:{port}/mcp', { port });
    }
    stop() {
        const server = this.server;
        if (!server) {
            logger.info('MCP server is not running, nothing to stop');
            return Promise.resolve();
        }
        logger.info('Stopping MCP server');
        this.server = undefined;
        return new Promise((resolve) => {
            server.close((err) => {
                if (err) {
                    logger.error('Failed to stop MCP server', { err });
                }
                else {
                    logger.info('MCP server stopped');
                }
                resolve();
            });
        });
    }
}
