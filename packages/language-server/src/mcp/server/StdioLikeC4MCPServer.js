import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../utils';
export class StdioLikeC4MCPServer {
    services;
    transport = undefined;
    _mcp = undefined;
    constructor(services) {
        this.services = services;
    }
    get mcp() {
        if (!this._mcp) {
            throw new Error('MCP server is not started');
        }
        return this._mcp;
    }
    get isStarted() {
        return this.transport !== undefined;
    }
    get port() {
        return NaN;
    }
    async dispose() {
        await this.stop();
    }
    async start() {
        if (this.transport) {
            return;
        }
        logger.info('Starting MCP stdio server');
        this._mcp = this.services.mcp.ServerFactory.create();
        this.transport = new StdioServerTransport();
        await this._mcp.connect(this.transport);
        logger.info('LikeC4 MCP Server running on stdio');
    }
    async stop() {
        if (!this.transport) {
            return;
        }
        try {
            logger.info('Stopping MCP stdio server');
            await this.transport.close();
            if (this._mcp) {
                await this._mcp.close();
            }
        }
        finally {
            this._mcp = undefined;
            this.transport = undefined;
        }
    }
}
