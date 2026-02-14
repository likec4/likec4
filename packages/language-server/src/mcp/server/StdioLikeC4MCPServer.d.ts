import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AsyncDisposable } from 'langium';
import type { LikeC4Services } from '../../module';
import type { LikeC4MCPServer } from '../types';
export declare class StdioLikeC4MCPServer implements LikeC4MCPServer, AsyncDisposable {
    private services;
    private transport;
    private _mcp;
    constructor(services: LikeC4Services);
    get mcp(): McpServer;
    get isStarted(): boolean;
    get port(): number;
    dispose(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
