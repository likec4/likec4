export const NoMCPServer = {
    mcpServer: () => new NoopLikeC4MCPServer(),
    mcpServerFactory: () => new NoopLikeC4MCPServerFactory(),
};
export class NoopLikeC4MCPServer {
    get mcp() {
        throw new Error('NoopLikeC4MCPServer does not have a McpServer');
    }
    get isStarted() {
        return false;
    }
    get port() {
        return NaN;
    }
    start() {
        return Promise.resolve();
    }
    stop() {
        return Promise.resolve();
    }
}
export class NoopLikeC4MCPServerFactory {
    create(_options) {
        throw new Error('NoopLikeC4MCPServerFactory');
    }
}
