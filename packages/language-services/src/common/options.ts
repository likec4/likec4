export type WithoutFileSystem = {
  useFileSystem: false
  watch?: never
}

export type WithFileSystem = {
  useFileSystem: true
  watch?: boolean
}

export type InitOptions = {
  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * Whether to start MCP server
   *
   * if port is specified, starts HTTP Streamable MCP server
   *
   * @default false
   */
  mcp?: false | 'stdio' | { port: number }
}

export type FromWorkspaceOptions = InitOptions & {
  /**
   * Whether to read and use manual layouts from the workspace.
   * @default true
   */
  manualLayouts?: boolean

  /**
   * Whether to watch for changes in the workspace.
   * @default false
   */
  watch?: boolean
}
