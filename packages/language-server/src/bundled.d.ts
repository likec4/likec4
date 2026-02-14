import type { LikeC4Services, LikeC4SharedServices } from './module';
type StartBundledLanguageServerOptions = {
    /**
     * Whether to enable the MCP server.
     * @default true
     */
    enableMCP?: boolean | {
        port: number;
    };
    /**
     * Whether to enable manual layouts, stored in json5 files.
     * @default true
     */
    enableManualLayouts?: boolean;
};
/**
 * This is used as `bin` entry point to start the language server.
 */
export declare function startLanguageServer(options?: StartBundledLanguageServerOptions): {
    shared: LikeC4SharedServices;
    likec4: LikeC4Services;
};
export {};
