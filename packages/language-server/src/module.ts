import { type Module, DocumentCache, EmptyFileSystem, inject, WorkspaceCache } from 'langium'
import {
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type PartialLangiumServices,
  type PartialLangiumSharedServices,
  createDefaultModule,
  createDefaultSharedModule,
} from 'langium/lsp'
import { LikeC4Formatter } from './formatting/LikeC4Formatter'
import { LikeC4GeneratedModule, LikeC4GeneratedSharedModule } from './generated/module'
import { logErrorToTelemetry, logToLspConnection } from './logger'
import {
  LikeC4CodeLensProvider,
  LikeC4CompletionProvider,
  LikeC4DocumentHighlightProvider,
  LikeC4DocumentLinkProvider,
  LikeC4DocumentSymbolProvider,
  LikeC4HoverProvider,
  LikeC4SemanticTokenProvider,
} from './lsp'
import { DeploymentsIndex, FqnIndex, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model'
import { LikeC4ModelChanges } from './model-change/ModelChanges'
import { LikeC4NameProvider, LikeC4ScopeComputation, LikeC4ScopeProvider } from './references'
import { Rpc } from './Rpc'
import { LikeC4WorkspaceManager, NodeKindProvider, WorkspaceSymbolProvider } from './shared'
import { registerValidationChecks } from './validation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T, Arguments extends unknown[] = any[]> = new(...arguments_: Arguments) => T

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
    WorkspaceSymbolProvider: services => new WorkspaceSymbolProvider(services),
  },
  workspace: {
    WorkspaceManager: services => new LikeC4WorkspaceManager(services),
  },
}

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface LikeC4AddedServices {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WorkspaceCache: WorkspaceCache<string, any>
  DocumentCache: DocumentCache<string, any>
  Rpc: Rpc
  likec4: {
    DeploymentsIndex: DeploymentsIndex
    FqnIndex: FqnIndex
    ModelParser: LikeC4ModelParser
    ModelBuilder: LikeC4ModelBuilder
    ModelLocator: LikeC4ModelLocator
    ModelChanges: LikeC4ModelChanges
  }
  lsp: {
    // RenameProvider: LikeC4RenameProvider
    CompletionProvider: LikeC4CompletionProvider
    DocumentHighlightProvider: LikeC4DocumentHighlightProvider
    DocumentSymbolProvider: LikeC4DocumentSymbolProvider
    SemanticTokenProvider: LikeC4SemanticTokenProvider
    HoverProvider: LikeC4HoverProvider
    CodeLensProvider: LikeC4CodeLensProvider
    DocumentLinkProvider: LikeC4DocumentLinkProvider
  }
  references: {
    NameProvider: LikeC4NameProvider
    ScopeComputation: LikeC4ScopeComputation
    ScopeProvider: LikeC4ScopeProvider
  }
  shared?: LikeC4SharedServices
}

export type LikeC4Services = LangiumServices & LikeC4AddedServices

function bind<T>(Type: Constructor<T, [LikeC4Services]>) {
  return (services: LikeC4Services) => new Type(services)
}

export const LikeC4Module: Module<LikeC4Services, PartialLangiumServices & LikeC4AddedServices> = {
  WorkspaceCache: (services: LikeC4Services) => new WorkspaceCache(services.shared),
  DocumentCache: (services: LikeC4Services) => new DocumentCache(services.shared),
  Rpc: bind(Rpc),
  likec4: {
    DeploymentsIndex: bind(DeploymentsIndex),
    ModelChanges: bind(LikeC4ModelChanges),
    FqnIndex: bind(FqnIndex),
    ModelParser: bind(LikeC4ModelParser),
    ModelBuilder: bind(LikeC4ModelBuilder),
    ModelLocator: bind(LikeC4ModelLocator),
  },
  lsp: {
    // RenameProvider: bind(LikeC4RenameProvider),
    CompletionProvider: bind(LikeC4CompletionProvider),
    DocumentHighlightProvider: bind(LikeC4DocumentHighlightProvider),
    DocumentSymbolProvider: bind(LikeC4DocumentSymbolProvider),
    SemanticTokenProvider: bind(LikeC4SemanticTokenProvider),
    HoverProvider: bind(LikeC4HoverProvider),
    CodeLensProvider: bind(LikeC4CodeLensProvider),
    DocumentLinkProvider: bind(LikeC4DocumentLinkProvider),
    Formatter: bind(LikeC4Formatter),
  },
  references: {
    NameProvider: bind(LikeC4NameProvider),
    ScopeComputation: bind(LikeC4ScopeComputation),
    ScopeProvider: bind(LikeC4ScopeProvider),
  },
}

export type LanguageServicesContext = Partial<DefaultSharedModuleContext>

export function createCustomLanguageServices<I1, I2, I3, I extends I1 & I2 & I3 & LikeC4Services>(
  context: LanguageServicesContext,
  module: Module<I, I1>,
  module2?: Module<I, I2>,
  module3?: Module<I, I3>,
): { shared: LikeC4SharedServices; likec4: I } {
  const shared = createSharedServices(context)
  const modules = [
    createDefaultModule({ shared }),
    LikeC4GeneratedModule,
    LikeC4Module,
    module,
    module2,
    module3,
  ].reduce(_merge, {}) as Module<I>

  const likec4 = inject(modules)
  shared.ServiceRegistry.register(likec4)
  registerValidationChecks(likec4)

  if (!context.connection) {
    // We don't run inside a language server
    // Therefore, initialize the configuration provider instantly
    shared.workspace.ConfigurationProvider.initialized({})
  } else {
    likec4.Rpc.init()
  }

  return { shared, likec4 }
}

export function createSharedServices(context: LanguageServicesContext = {}): LikeC4SharedServices {
  const moduleContext: DefaultSharedModuleContext = {
    ...EmptyFileSystem,
    ...context,
  }
  if (context.connection) {
    logToLspConnection(context.connection)
  }

  return inject(
    createDefaultSharedModule(moduleContext),
    LikeC4GeneratedSharedModule,
    LikeC4SharedModule,
  )
}

export function createLanguageServices(context: LanguageServicesContext = {}): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  const shared = createSharedServices(context)
  const likec4 = inject(createDefaultModule({ shared }), LikeC4GeneratedModule, LikeC4Module)
  shared.ServiceRegistry.register(likec4)
  registerValidationChecks(likec4)

  if (context.connection) {
    likec4.Rpc.init()
  }

  return { shared, likec4 }
}

// Copied from langium/src/dependency-injection.ts as it is not exported
function _merge(target: Module<any>, source?: Module<any>): Module<unknown> {
  if (source) {
    for (const [key, value2] of Object.entries(source)) {
      if (value2 !== undefined) {
        const value1 = target[key]
        if (value1 !== null && value2 !== null && typeof value1 === 'object' && typeof value2 === 'object') {
          target[key] = _merge(value1, value2)
        } else {
          target[key] = value2
        }
      }
    }
  }
  return target
}
