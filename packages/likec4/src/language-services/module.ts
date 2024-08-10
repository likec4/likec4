import type { LikeC4Services, LikeC4SharedServices } from '@likec4/language-server'
import { createCustomLanguageServices, setLogLevel } from '@likec4/language-server'
import { GraphvizLayouter } from '@likec4/layouts'
import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
import { GraphvizWasmAdapter } from '@likec4/layouts/graphviz/wasm'
import type { DeepPartial, Module } from 'langium'
import { NodeFileSystem } from 'langium/node'
import type { Constructor } from 'type-fest'
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
export function createServices({
  logger = createLikeC4Logger('c4:lsp '),
  useDotBin = false
}: {
  logger?: Logger
  useDotBin?: boolean
} = {}): {
  shared: LikeC4SharedServices
  likec4: CliServices
} {
  const module = {
    logger: () => logger,
    likec4: {
      Layouter: () => new GraphvizLayouter(useDotBin === true ? new GraphvizBinaryAdapter() : new GraphvizWasmAdapter())
    }
  } satisfies Module<CliServices, DeepPartial<CliAddedServices>>
  setLogLevel('warn')
  return createCustomLanguageServices(NodeFileSystem, CliModule, module)
}
