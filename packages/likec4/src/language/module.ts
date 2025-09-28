import {
  type LikeC4Services,
  createLanguageServices as createCustomLanguageServices,
  LikeC4FileSystem,
  NoopFileSystem,
  WithMCPServer,
} from '@likec4/language-server'
import { GraphvizWasmAdapter, QueueGraphvizLayoter } from '@likec4/layouts'
import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
import { configureLogger, getConsoleStderrSink, loggable } from '@likec4/log'
import defu from 'defu'
import type { DeepPartial, Module } from 'langium'
import k from 'tinyrainbow'
import type { Constructor } from 'type-fest'
import { version } from '../../package.json' with { type: 'json' }
import { type Logger, createLikeC4Logger, logger as cliLogger, NoopLogger } from '../logger'
import { CliWorkspace } from './Workspace'

export type CliAddedServices = {
  logger: Logger
  cli: {
    Workspace: CliWorkspace
  }
}

export type CliServices = LikeC4Services & CliAddedServices

function bind<T>(Type: Constructor<T, [CliServices]>) {
  return (services: CliServices) => new Type(services)
}

export const CliModule: Module<CliServices, DeepPartial<LikeC4Services> & CliAddedServices> = {
  logger: () => {
    throw new Error('Logger must be provided')
  },
  cli: {
    Workspace: bind(CliWorkspace),
  },
}

export type CreateLanguageServiceOptions = {
  /**
   * Whether to use the file system for the language service.
   * @default true
   */
  useFileSystem?: boolean

  /**
   * Whether to watch for changes in the workspace.
   * @default false
   */
  watch?: boolean
  /**
   * Logger to use for the language service.
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
}

export function createLanguageServices(opts?: CreateLanguageServiceOptions): CliServices {
  const options = defu(opts, {
    useFileSystem: true,
    watch: false,
    logger: 'default' as const,
    graphviz: 'wasm',
    mcp: false as const,
  })
  let logger: Logger

  if (options.mcp === 'stdio') {
    configureLogger({
      reset: true,
      sinks: {
        // Name it as console to override internal logger
        console: getConsoleStderrSink(),
      },
    })
    options.logger = 'default'
  }

  switch (options.logger) {
    case false:
      logger = NoopLogger
      break
    case 'vite':
      logger = createLikeC4Logger('lang')
      break
    case 'default':
      logger = cliLogger.getChild('lang')
      break
    default:
      logger = options.logger
      break
  }
  const useDotBin = options.graphviz === 'binary'
  logger.info(`${k.dim('version')} ${version}`)
  logger.info(`${k.dim('layout')} ${useDotBin ? 'binary' : 'wasm'}`)

  const module = {
    logger: () => logger,
    likec4: {
      Layouter: () =>
        new QueueGraphvizLayoter({
          graphviz: useDotBin ? new GraphvizBinaryAdapter() : new GraphvizWasmAdapter(),
        }),
    },
  } satisfies Module<CliServices, DeepPartial<CliServices>>

  const { likec4 } = createCustomLanguageServices(
    {
      ...options.useFileSystem ? LikeC4FileSystem(options.watch) : NoopFileSystem,
      ...options.mcp ? WithMCPServer(options.mcp === 'stdio' ? 'stdio' : 'sse') : {},
    },
    CliModule,
    module,
  )

  if (typeof options.mcp === 'object' && options.mcp.port) {
    void likec4.mcp.Server.start(options.mcp.port).catch((e) => {
      logger.error(loggable(e))
    })
  }
  if (options.mcp === 'stdio') {
    void likec4.mcp.Server.start().catch((e) => {
      logger.error(loggable(e))
    })
  }

  return likec4
}
