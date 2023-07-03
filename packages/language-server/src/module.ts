import type {
  DefaultSharedModuleContext,
  LangiumServices,
  LangiumSharedServices,
  Module,
  PartialLangiumServices,
  PartialLangiumSharedServices
} from 'langium'
import { createDefaultModule, createDefaultSharedModule, EmptyFileSystem, inject } from 'langium'
import { LikeC4GeneratedModule, LikeC4GeneratedSharedModule } from './generated/module'
import {
  LikeC4DocumentSymbolProvider,
  LikeC4HoverProvider,
  LikeC4SemanticTokenProvider
} from './lsp'
import { FqnIndex, LikeC4ModelBuilder, LikeC4ModelLocator } from './model'
import { LikeC4ScopeComputation, LikeC4ScopeProvider } from './references'
import { registerProtocolHandlers } from './registerProtocolHandlers'
import { LikeC4CodeLensProvider, LikeC4WorkspaceManager } from './shared'
import { registerValidationChecks } from './validation'
import { logger } from './logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T, Arguments extends unknown[] = any[]> = new(...arguments_: Arguments) => T;

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface LikeC4AddedServices {
  likec4: {
    FqnIndex: FqnIndex
    ModelBuilder: LikeC4ModelBuilder
    ModelLocator: LikeC4ModelLocator
  }
}

export type LikeC4Services = LangiumServices & LikeC4AddedServices

function bind<T>(Type: Constructor<T, [LikeC4Services]>) {
  return (services: LikeC4Services) => new Type(services)
}

export const LikeC4Module: Module<LikeC4Services, PartialLangiumServices & LikeC4AddedServices> = {
  likec4: {
    FqnIndex: bind(FqnIndex),
    ModelBuilder: bind(LikeC4ModelBuilder),
    ModelLocator: bind(LikeC4ModelLocator)
  },
  lsp: {
    DocumentSymbolProvider: bind(LikeC4DocumentSymbolProvider),
    SemanticTokenProvider: bind(LikeC4SemanticTokenProvider),
    HoverProvider: bind(LikeC4HoverProvider)
  },
  //
  //   // Formatter: bind(LikeC4Formatter),
  //
  // },
  references: {
    ScopeComputation: bind(LikeC4ScopeComputation),
    ScopeProvider: bind(LikeC4ScopeProvider)
  }
}

const LikeC4SharedModule: Module<LangiumSharedServices, PartialLangiumSharedServices> = {
  ...LikeC4GeneratedSharedModule,
  workspace: {
    WorkspaceManager: services => new LikeC4WorkspaceManager(services)
  },
  lsp: {
    CodeLensProvider: services => new LikeC4CodeLensProvider(services)
  }
}

type LanguageServicesContext = Partial<DefaultSharedModuleContext>

export function createLanguageServices(context?: LanguageServicesContext): {
  shared: LangiumSharedServices
  likec4: LikeC4Services
} {
  const connection = context?.connection
  if (connection) {
    const log = (method: 'log' | 'info' | 'warn' | 'error') => (message: unknown) => {
      try {
        console[method](message)
        connection.console[method](String(message))
        if (method === 'error') {
          connection.telemetry.logEvent({ eventName: 'error', message})
        }
      } catch (error) {
        console.error(error)
      }
    }
    logger.log = log('log')
    logger.info = log('info')
    logger.warn = log('warn')
    logger.error = log('error')
    logger.trace = logger.debug = (message: string) => {
      console.debug(message)
      connection.tracer.log(message)
    }
  }

  const moduleContext: DefaultSharedModuleContext = {
    ...EmptyFileSystem,
    ...context
  }

  const shared = inject(createDefaultSharedModule(moduleContext), LikeC4SharedModule)
  const likec4 = inject(createDefaultModule({ shared }), LikeC4GeneratedModule, LikeC4Module)
  shared.ServiceRegistry.register(likec4)
  registerValidationChecks(likec4)
  registerProtocolHandlers(likec4)
  return { shared, likec4 }
}
