import {
  fromSource as fromSourceImpl,
  fromWorkspace as fromWorkspaceImpl,
  LikeC4 as AbstractLikeC4,
} from '@likec4/language-services/node'
import type { Logger } from './logger'

export type LikeC4Options = {
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
   * Logger to use for the language service.
   * false - no output
   * @default 'default'
   */
  logger?: Logger | 'vite' | 'default' | false
  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * Whether to start MCP server
   * @default false
   */
  mcp?: false | 'stdio' | { port: number }

  /**
   * Whether to watch for changes in the workspace.
   * @default false
   */
  watch?: boolean
}

export interface LikeC4 extends AbstractLikeC4 {
}

export namespace LikeC4 {
  export async function fromSource(likec4SourceCode: string, opts?: LikeC4Options): Promise<LikeC4> {
    return fromSourceImpl(likec4SourceCode, opts)
  }

  /**
   * Initializes a LikeC4 instance from the specified workspace path.
   * By default in current folder
   */
  export async function fromWorkspace(path = '.', opts?: LikeC4Options): Promise<LikeC4> {
    return fromWorkspaceImpl(path, opts)
  }
}
