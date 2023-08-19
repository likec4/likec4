import { normalizeError, serializeError } from '@likec4/core'
import type {
  DefaultSharedModuleContext,
  LangiumServices,
  LangiumSharedServices,
  Module,
  PartialLangiumServices,
  PartialLangiumSharedServices
} from 'langium'
import { EmptyFileSystem, createDefaultModule, createDefaultSharedModule, inject } from 'langium'
import { LikeC4GeneratedModule, LikeC4GeneratedSharedModule } from './generated/module'
import { logger } from './logger'
import {
  LikeC4DocumentSymbolProvider,
  LikeC4HoverProvider,
  LikeC4SemanticTokenProvider,
  LikeC4CodeLensProvider,
  LikeC4DocumentLinkProvider
} from './lsp'
import { FqnIndex, LikeC4ModelParser, LikeC4ModelLocator, LikeC4ModelBuilder } from './model'
import { LikeC4ScopeComputation, LikeC4ScopeProvider } from './references'
import { registerProtocolHandlers } from './registerProtocolHandlers'
import { LikeC4WorkspaceManager } from './shared'
import { registerValidationChecks } from './validation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T, Arguments extends unknown[] = any[]> = new (...arguments_: Arguments) => T

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface LikeC4AddedServices {
  likec4: {
    FqnIndex: FqnIndex
    ModelParser: LikeC4ModelParser
    ModelBuilder: LikeC4ModelBuilder
    ModelLocator: LikeC4ModelLocator
  }
  lsp: {
    DocumentSymbolProvider: LikeC4DocumentSymbolProvider
  }
}

export type LikeC4Services = LangiumServices & LikeC4AddedServices

function bind<T>(Type: Constructor<T, [LikeC4Services]>) {
  return (services: LikeC4Services) => new Type(services)
}

export const LikeC4Module: Module<LikeC4Services, PartialLangiumServices & LikeC4AddedServices> = {
  likec4: {
    FqnIndex: bind(FqnIndex),
    ModelParser: bind(LikeC4ModelParser),
    ModelBuilder: bind(LikeC4ModelBuilder),
    ModelLocator: bind(LikeC4ModelLocator)
  },
  lsp: {
    DocumentSymbolProvider: bind(LikeC4DocumentSymbolProvider),
    SemanticTokenProvider: bind(LikeC4SemanticTokenProvider),
    HoverProvider: bind(LikeC4HoverProvider),
    CodeLensProvider: bind(LikeC4CodeLensProvider),
    DocumentLinkProvider: bind(LikeC4DocumentLinkProvider)
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
  workspace: {
    WorkspaceManager: services => new LikeC4WorkspaceManager(services)
  }
}

type LanguageServicesContext = Partial<DefaultSharedModuleContext>

export function createLanguageServices(context?: LanguageServicesContext): {
  shared: LangiumSharedServices
  likec4: LikeC4Services
} {
  const connection = context?.connection
  if (connection) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = logger.error
    logger.error = (arg: unknown) => {
      if (typeof arg === 'string') {
        console.error(arg)
        connection.telemetry.logEvent({ eventName: 'error', error: arg })
        return
      }
      const { message, error } = serializeError(arg)
      console.error(error)
      connection.telemetry.logEvent({ eventName: 'error', error: message })
    }
    connection.onShutdown(() => {
      logger.error = original
    })
  }

  const moduleContext: DefaultSharedModuleContext = {
    ...EmptyFileSystem,
    ...context
  }

  const shared = inject(createDefaultSharedModule(moduleContext), LikeC4GeneratedSharedModule, LikeC4SharedModule)
  const likec4 = inject(createDefaultModule({ shared }), LikeC4GeneratedModule, LikeC4Module)
  shared.ServiceRegistry.register(likec4)
  registerValidationChecks(likec4)
  registerProtocolHandlers(likec4)
  return { shared, likec4 }
}
