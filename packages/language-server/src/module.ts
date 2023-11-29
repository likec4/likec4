import { serializeError } from '@likec4/core'
import {
  EmptyFileSystem,
  WorkspaceCache,
  createDefaultModule,
  createDefaultSharedModule,
  inject,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type Module,
  type PartialLangiumServices,
  type PartialLangiumSharedServices
} from 'langium'
import { Rpc } from './Rpc'
import { LikeC4GeneratedModule, LikeC4GeneratedSharedModule } from './generated/module'
import { logger } from './logger'
import {
  LikeC4CodeLensProvider,
  LikeC4DocumentLinkProvider,
  LikeC4DocumentSymbolProvider,
  LikeC4HoverProvider,
  LikeC4SemanticTokenProvider
} from './lsp'
import { FqnIndex, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model'
import { LikeC4ScopeComputation, LikeC4ScopeProvider } from './references'
import { LikeC4WorkspaceManager, NodeKindProvider, WorkspaceSymbolProvider } from './shared'
import { registerValidationChecks } from './validation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T, Arguments extends unknown[] = any[]> = new (...arguments_: Arguments) => T

interface LikeC4AddedSharedServices {
  lsp: {
    NodeKindProvider: NodeKindProvider
    WorkspaceSymbolProvider: WorkspaceSymbolProvider
  }
  workspace: {
    WorkspaceManager: LikeC4WorkspaceManager
  }
}

export type LikeC4SharedServices = LangiumSharedServices & LikeC4AddedSharedServices

const LikeC4SharedModule: Module<
  LikeC4SharedServices,
  PartialLangiumSharedServices & LikeC4AddedSharedServices
> = {
  lsp: {
    NodeKindProvider: services => new NodeKindProvider(services),
    WorkspaceSymbolProvider: services => new WorkspaceSymbolProvider(services)
  },
  workspace: {
    WorkspaceManager: services => new LikeC4WorkspaceManager(services)
  }
}

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface LikeC4AddedServices {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WorkspaceCache: WorkspaceCache<string, any>
  Rpc: Rpc
  likec4: {
    FqnIndex: FqnIndex
    ModelParser: LikeC4ModelParser
    ModelBuilder: LikeC4ModelBuilder
    ModelLocator: LikeC4ModelLocator
  }
  lsp: {
    DocumentLinkProvider: LikeC4DocumentLinkProvider
    DocumentSymbolProvider: LikeC4DocumentSymbolProvider
  }
  shared?: LikeC4SharedServices
}

export type LikeC4Services = LangiumServices & LikeC4AddedServices

function bind<T>(Type: Constructor<T, [LikeC4Services]>) {
  return (services: LikeC4Services) => new Type(services)
}

export const LikeC4Module: Module<LikeC4Services, PartialLangiumServices & LikeC4AddedServices> = {
  WorkspaceCache: (services: LikeC4Services) => new WorkspaceCache(services.shared),
  Rpc: bind(Rpc),
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
  references: {
    ScopeComputation: bind(LikeC4ScopeComputation),
    ScopeProvider: bind(LikeC4ScopeProvider)
  }
}

type LanguageServicesContext = Partial<DefaultSharedModuleContext>
export function createLanguageServices(context?: LanguageServicesContext): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  const connection = context?.connection
  if (connection) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = logger.error.bind(logger)
    logger.error = (arg: unknown) => {
      if (typeof arg === 'string') {
        original(arg)
        connection.telemetry.logEvent({ eventName: 'error', error: arg })
        return
      }
      const { message, error } = serializeError(arg)
      original(error)
      connection.telemetry.logEvent({ eventName: 'error', error: message })
    }
  }

  const moduleContext: DefaultSharedModuleContext = {
    ...EmptyFileSystem,
    ...context
  }

  const shared = inject(
    createDefaultSharedModule(moduleContext),
    LikeC4GeneratedSharedModule,
    LikeC4SharedModule
  )
  const likec4 = inject(createDefaultModule({ shared }), LikeC4GeneratedModule, LikeC4Module)
  shared.ServiceRegistry.register(likec4)
  registerValidationChecks(likec4)
  likec4.Rpc.init()
  return { shared, likec4 }
}
