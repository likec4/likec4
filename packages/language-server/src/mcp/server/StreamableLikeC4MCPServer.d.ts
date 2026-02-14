import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AsyncDisposable } from 'langium';
import type { LikeC4Services } from '../../module';
import type { LikeC4MCPServer } from '../types';
export declare class StreamableLikeC4MCPServer implements LikeC4MCPServer, AsyncDisposable {
    private services;
    private _port;
    private server;
    constructor(services: LikeC4Services, _port?: number);
    get mcp(): McpServer;
    get isStarted(): boolean;
    get port(): number;
    dispose(): Promise<void>;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
}
