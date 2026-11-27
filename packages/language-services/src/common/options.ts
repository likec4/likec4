export type WithoutFileSystem = {
  useFileSystem: false
  watch?: never
}

export type WithFileSystem = {
  useFileSystem: true
  watch?: boolean
}

export interface InitOptions {
  /**
   * By default, if LikeC4 model is invalid, errors are printed to the console.
   * Disable this behavior by setting this option to false.
   *
   * @default true
   */
  printErrors?: boolean
  /**
   * If true, initialization will return rejected promise with the LikeC4 instance.
   * Use `likec4.getErrors()` to get the errors.
   * @default false
   */
  throwIfInvalid?: boolean
  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * Whether to configure the logger.
   *
   * - `false` - don't configure the logger (assume it's already configured)
   * - `'console'` - configure the logger with console sink
   * - `'stderr'` - configure the logger with stderr (for LSP or MCP)
   *
   * @default false
   */
  configureLogger?: false | 'console' | 'stderr'

  /**
   * The log level to use.
   * Applied if {@link configureLogger} is not `false`
   */
  logLevel?: 'trace' | 'debug' | 'info' | 'warning' | 'error' | undefined
}

export const DefaultInitOptions = {
  printErrors: true,
  throwIfInvalid: false,
  graphviz: 'wasm',
  configureLogger: false,
  logLevel: undefined,
} as const satisfies Required<InitOptions>

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

  /**
   * Cache directory for internal generated data (likeC4 views cache, etc.).
   * If not provided, cache will be stored in memory.
   */
  cacheDir?: string | undefined

  /**
   * Limits the instance to these projects (by id).
   * The whole workspace is still parsed, so imports between projects keep working.
   *
   * - {@link LikeC4.projects} returns only these projects
   * - methods that accept a project reject the others
   * - with a single project, it is used when no project is given,
   *   and also owns sources that are outside of every project
   *
   * Unknown ids make initialization fail.
   * If not set, all projects of the workspace are available.
   */
  includeProjects?: string | ReadonlyArray<string> | undefined
}
