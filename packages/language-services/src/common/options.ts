export type WithoutFileSystem = {
  useFileSystem: false
  watch?: never
}

export type WithFileSystem = {
  useFileSystem: true
  watch?: boolean
}

export type FromWorkspaceOptions = {
  /**
   * Whether to read manual layouts from the workspace.
   * @default true
   */
  manualLayouts?: boolean

  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * Whether to watch for changes in the workspace.
   * @default false
   */
  watch?: boolean
}
