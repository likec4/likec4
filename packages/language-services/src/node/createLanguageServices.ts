import {
  createLanguageServices as createCustomLanguageServices,
  NoFileSystem,
  NoLikeC4ManualLayouts,
  WithFileSystem,
  WithLikeC4ManualLayouts,
  WithMCPServer,
} from '@likec4/language-server'
import { GraphvizWasmAdapter, QueueGraphvizLayoter } from '@likec4/layouts'
import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
import { configureLogger, getConsoleStderrSink, loggable, rootLogger } from '@likec4/log'
import defu from 'defu'
import k from 'tinyrainbow'
import type { LikeC4Langium } from '../common/LikeC4'

export type CreateLanguageServiceOptions = {
  /**
   * Whether to use the file system for the language service.
   * @default true
   */
  useFileSystem?: boolean

  /**
   * Whether to read manual layouts from the workspace.
   * @default true
   */
  manualLayouts?: boolean

  /**
   * Whether to watch for changes in the workspace.
   * @default false
   */
  watch?: boolean

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
}

export function createLanguageServices(
  opts?: CreateLanguageServiceOptions,
): LikeC4Langium {
  const logger = rootLogger.getChild('lang')

  const options = defu(opts, {
    useFileSystem: true,
    manualLayouts: true,
    watch: false,
    graphviz: 'wasm',
    mcp: false as const,
  })

  if (options.mcp === 'stdio') {
    configureLogger({
      reset: true,
      sinks: {
        // Name it as console to override internal logger
        console: getConsoleStderrSink(),
      },
    })
  }

  const useDotBin = options.graphviz === 'binary'

  logger.info(`${k.dim('layout')} ${useDotBin ? 'binary' : 'wasm'}`)

  const langium = createCustomLanguageServices(
    {
      ...options.useFileSystem
        ? {
          ...WithFileSystem(options.watch),
          ...options.manualLayouts ? WithLikeC4ManualLayouts : NoLikeC4ManualLayouts,
        }
        : {
          ...NoFileSystem,
          ...NoLikeC4ManualLayouts,
        },
      ...options.mcp ? WithMCPServer(options.mcp === 'stdio' ? 'stdio' : options.mcp) : {},
    },
    {
      likec4: {
        Layouter: () =>
          new QueueGraphvizLayoter({
            graphviz: useDotBin ? new GraphvizBinaryAdapter() : new GraphvizWasmAdapter(),
          }),
      },
    },
  )

  if (typeof options.mcp === 'object' && options.mcp.port) {
    void langium.likec4.mcp.Server.start(options.mcp.port).catch((e) => {
      logger.error(loggable(e))
    })
  }
  if (options.mcp === 'stdio') {
    void langium.likec4.mcp.Server.start().catch((e) => {
      logger.error(loggable(e))
    })
  }

  return langium
}
