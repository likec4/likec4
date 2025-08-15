import {
  type LikeC4Services,
  createLanguageServices as createCustomLanguageServices,
  LikeC4FileSystem,
} from '@likec4/language-server'
import { GraphvizWasmAdapter, QueueGraphvizLayoter } from '@likec4/layouts'
import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
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
   * @default true if useFileSystem is true, false otherwise
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
}

export function createLanguageServices(opts?: CreateLanguageServiceOptions): CliServices {
  const options = defu(opts, {
    useFileSystem: true,
    logger: 'default' as const,
    graphviz: 'wasm',
  })
  let logger: Logger

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
    options.useFileSystem ? LikeC4FileSystem(options.watch) : {},
    CliModule,
    module,
  )
  return likec4
}
