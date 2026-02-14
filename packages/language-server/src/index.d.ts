import type { Connection } from 'vscode-languageserver';
import { WithFileSystem } from './filesystem/LikeC4FileSystem';
import { WithLikeC4ManualLayouts } from './filesystem/LikeC4ManualLayouts';
import { WithMCPServer } from './mcp';
import type { LikeC4Services, LikeC4SharedServices } from './module';
export type * from './common-exports';
export { createLanguageServices, NoFileSystem, NoFileSystemWatcher, NoLikeC4ManualLayouts, NoMCPServer, } from './common-exports';
export { WithFileSystem, WithLikeC4ManualLayouts, WithMCPServer, };
type StartLanguageServerOptions = {
    /**
     * The Language Server Protocol connection to use.
     */
    connection?: Connection;
    /**
     * Whether to enable the file system watcher.
     * @default true
     */
    enableWatcher?: boolean;
    /**
     * @default true
     */
    enableTelemetry?: boolean;
    /**
     * Whether to enable the MCP server.
     * @default 'sse'
     */
    enableMCP?: false | 'stdio' | 'sse' | {
        port: number;
    };
    /**
     * Whether to enable manual layouts, stored in json5 files.
     * @default true
     */
    enableManualLayouts?: boolean;
};
export declare function startLanguageServer(options?: StartLanguageServerOptions): {
    shared: LikeC4SharedServices;
    likec4: LikeC4Services;
};
