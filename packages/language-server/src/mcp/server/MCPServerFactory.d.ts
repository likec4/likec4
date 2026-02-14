import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LikeC4Services } from '../../module';
import type { LikeC4MCPServerFactory } from '../types';
export declare class MCPServerFactory implements LikeC4MCPServerFactory {
    private services;
    constructor(services: LikeC4Services);
    create(options?: ServerOptions): McpServer;
}
