import { createCustomLanguageServices, type LikeC4Services, setLogLevel } from '@likec4/language-server'
import { GraphvizLayouter } from '@likec4/layouts'
import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
import { GraphvizWasmAdapter } from '@likec4/layouts/graphviz/wasm'
import { consola } from '@likec4/log'
import defu from 'defu'
import type { DeepPartial, Module } from 'langium'
import { NodeFileSystem } from 'langium/node'
import k from 'tinyrainbow'
import type { Constructor } from 'type-fest'
import pkg from '../../package.json' with { type: 'json' }
import { createLikeC4Logger, type Logger } from '../logger'
import { Views } from './Views'
import { CliWorkspace } from './Workspace'

export type CliAddedServices = {
  logger: Logger
  likec4: {
    Layouter: GraphvizLayouter
    Views: Views
  }
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
  likec4: {
    Layouter: () => {
      throw new Error('Layouter must be provided')
    },
    Views: bind(Views)
  },
  cli: {
    Workspace: bind(CliWorkspace)
  }
}

export type CreateLanguageServiceOptions = {
  /**
   * Whether to use the file system for the language service.
   * @default true
   */
  useFileSystem?: boolean
  /**
   * Logger to use for the language service.
   * @default 'default'
   */
  logger?: Logger | 'vite' | 'default'
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
    graphviz: 'wasm'
  })
  let logger: Logger

  switch (options.logger) {
    case 'vite':
      logger = createLikeC4Logger('c4:lsp ')
      break
    case 'default':
      logger = consola
      break
    default:
      logger = options.logger
  }
  const useDotBin = options.graphviz === 'binary'
  logger.info(`${k.dim('version')} ${pkg.version}`)
  logger.info(`${k.dim('layout')} ${useDotBin ? 'binary' : 'wasm'}`)

  const module = {
    logger: () => logger,
    likec4: {
      Layouter: () => new GraphvizLayouter(useDotBin === true ? new GraphvizBinaryAdapter() : new GraphvizWasmAdapter())
    }
  } satisfies Module<CliServices, DeepPartial<CliAddedServices>>

  setLogLevel('warn')

  return createCustomLanguageServices(options.useFileSystem ? NodeFileSystem : {}, CliModule, module).likec4
}
