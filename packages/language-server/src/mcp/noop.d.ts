import type { LikeC4MCPServer, LikeC4MCPServerFactory, LikeC4MCPServerModuleContext } from './types';
export declare const NoMCPServer: LikeC4MCPServerModuleContext;
export declare class NoopLikeC4MCPServer implements LikeC4MCPServer {
    get mcp(): any;
    get isStarted(): boolean;
    get port(): number;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare class NoopLikeC4MCPServerFactory implements LikeC4MCPServerFactory {
    create(_options?: any): any;
}
