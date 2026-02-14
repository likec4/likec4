import type { LikeC4MCPServerModuleContext } from '../types';
export declare function WithMCPServer(type?: 'stdio' | 'sse' | {
    port: number;
}): LikeC4MCPServerModuleContext;
