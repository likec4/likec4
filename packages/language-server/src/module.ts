import { onNextTick } from '@likec4/core/utils'
import { GraphvizWasmAdapter, QueueGraphvizLayoter } from '@likec4/layouts'
import type { Module } from 'langium'
import { DocumentState, inject, WorkspaceCache } from 'langium'
import type {
  DefaultSharedModuleContext,
  LangiumServices,
  LangiumSharedServices,
  PartialLangiumServices,
  PartialLangiumSharedServices,
} from 'langium/lsp'
import { createDefaultModule, createDefaultSharedModule } from 'langium/lsp'
import { LikeC4DocumentationProvider } from './documentation'
import type {
  FileSystemModuleContext,
  FileSystemProvider,
  FileSystemWatcher,
  LikeC4ManualLayouts,
  LikeC4ManualLayoutsModuleContext,
} from './filesystem'
import { NoFileSystem, NoLikeC4ManualLayouts } from './filesystem'
import { LikeC4Formatter } from './formatting/LikeC4Formatter'
import {
  LikeC4GeneratedModule,
  LikeC4GeneratedSharedModule,
} from './generated/module'
import { type LikeC4LanguageServices, DefaultLikeC4LanguageServices } from './LikeC4LanguageServices'
import {
  LikeC4CodeActionProvider,
  LikeC4CodeLensProvider,
  LikeC4CompletionProvider,
  LikeC4DocumentHighlightProvider,
  LikeC4DocumentLinkProvider,
  LikeC4DocumentSymbolProvider,
  LikeC4HoverProvider,
  LikeC4SemanticTokenProvider,
} from './lsp'
import type { LikeC4MCPServer, LikeC4MCPServerFactory, LikeC4MCPServerModuleContext } from './mcp/index'
import { NoMCPServer } from './mcp/index'
import {
  type LikeC4ModelBuilder,
  DefaultLikeC4ModelBuilder,
  DeploymentsIndex,
  FqnIndex,
  LikeC4ModelLocator,
  LikeC4ModelParser,
  LikeC4ValueConverter,
} from './model'
import { LikeC4ModelChanges } from './model-change/ModelChanges'
import {
  LikeC4NameProvider,
  LikeC4ScopeComputation,
  LikeC4ScopeProvider,
} from './references'
import { Rpc } from './Rpc'
import {
  NodeKindProvider,
  WorkspaceSymbolProvider,
} from './shared'
import { LikeC4DocumentValidator, registerValidationChecks } from './validation'
import type { LikeC4Views } from './views'
import { DefaultLikeC4Views } from './views'
import {
  AstNodeDescriptionProvider,
  IndexManager,
  LangiumDocuments,
  LikeC4WorkspaceManager,
  ProjectsManager,
} from './workspace'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T, Arguments extends unknown[] = any[]> = new(...arguments_: Arguments) => T

export type LanguageServicesContext =
  & Omit<DefaultSharedModuleContext, 'fileSystemProvider'>
  & FileSystemModuleContext
  & LikeC4MCPServerModuleContext
  & LikeC4ManualLayoutsModuleContext

interface LikeC4AddedSharedServices {
  lsp: {
    NodeKindProvider: NodeKindProvider
    WorkspaceSymbolProvider: WorkspaceSymbolProvider
  }
  workspace: {
    // WorkspaceCache on Validated state
    Cache: WorkspaceCache<string, any>
    ProjectsManager: ProjectsManager
    IndexManager: IndexManager
    LangiumDocuments: LangiumDocuments
    WorkspaceManager: LikeC4WorkspaceManager
    FileSystemProvider: FileSystemProvider
    FileSystemWatcher: FileSystemWatcher
    ManualLayouts: LikeC4ManualLayouts
  }
}

export type LikeC4SharedServices = LangiumSharedServices & LikeC4AddedSharedServices

function createLikeC4SharedModule(context: LanguageServicesContext): Module<
  LikeC4SharedServices,
  PartialLangiumSharedServices & LikeC4AddedSharedServices
> {
  return ({
    lsp: {
      NodeKindProvider: services => new NodeKindProvider(services),
      WorkspaceSymbolProvider: services => new WorkspaceSymbolProvider(services),
    },
    workspace: {
      Cache: services => new WorkspaceCache(services, DocumentState.Validated),
      IndexManager: services => new IndexManager(services),
      LangiumDocuments: services => new LangiumDocuments(services),
      ProjectsManager: services => new ProjectsManager(services),
      WorkspaceManager: services => new LikeC4WorkspaceManager(services),
      FileSystemProvider: () => context.fileSystemProvider(),
      FileSystemWatcher: services => context.fileSystemWatcher(services),
      ManualLayouts: services => context.manualLayouts(services),
    },
  })
}

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface LikeC4AddedServices {
  documentation: {
    DocumentationProvider: LikeC4DocumentationProvider
  }
  validation: {
    DocumentValidator: LikeC4DocumentValidator
  }
  Rpc: Rpc
  mcp: {
    Server: LikeC4MCPServer
    ServerFactory: LikeC4MCPServerFactory
  }
  likec4: {
    LanguageServices: LikeC4LanguageServices
    Views: LikeC4Views
    Layouter: QueueGraphvizLayoter
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
    Formatter: LikeC4Formatter
    CodeActionProvider: LikeC4CodeActionProvider
  }
  references: {
    NameProvider: LikeC4NameProvider
    ScopeComputation: LikeC4ScopeComputation
    ScopeProvider: LikeC4ScopeProvider
  }
  shared?: LikeC4SharedServices
  parser: {
    ValueConverter: LikeC4ValueConverter
  }
}

export type LikeC4Services = LangiumServices & LikeC4AddedServices

function bind<T>(Type: Constructor<T, [LikeC4Services]>) {
  return (services: LikeC4Services) => new Type(services)
}

export function createLikeC4Module(
  context: LikeC4MCPServerModuleContext,
): Module<LikeC4Services, PartialLangiumServices & LikeC4AddedServices> {
  return ({
    documentation: {
      DocumentationProvider: bind(LikeC4DocumentationProvider),
    },
    validation: {
      DocumentValidator: bind(LikeC4DocumentValidator),
    },
    Rpc: bind(Rpc),
    mcp: {
      Server: (services: LikeC4Services) => context.mcpServer(services),
      ServerFactory: (services: LikeC4Services) => context.mcpServerFactory(services),
    },
    likec4: {
      LanguageServices: bind(DefaultLikeC4LanguageServices),
      Layouter: (_services: LikeC4Services) => {
        return new QueueGraphvizLayoter({
          graphviz: new GraphvizWasmAdapter(),
        })
      },
      Views: bind(DefaultLikeC4Views),
      DeploymentsIndex: bind(DeploymentsIndex),
      ModelChanges: bind(LikeC4ModelChanges),
      FqnIndex: bind(FqnIndex),
      ModelParser: bind(LikeC4ModelParser),
      ModelBuilder: bind(DefaultLikeC4ModelBuilder),
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
      CodeActionProvider: bind(LikeC4CodeActionProvider),
    },
    workspace: {
      AstNodeDescriptionProvider: bind(AstNodeDescriptionProvider),
    },
    references: {
      NameProvider: bind(LikeC4NameProvider),
      ScopeComputation: bind(LikeC4ScopeComputation),
      ScopeProvider: bind(LikeC4ScopeProvider),
    },
    parser: {
      ValueConverter: bind(LikeC4ValueConverter),
    },
  })
}

export function createLanguageServices(
  context: Partial<LanguageServicesContext>,
): { shared: LikeC4SharedServices; likec4: LikeC4Services }
export function createLanguageServices(
  context: Partial<LanguageServicesContext>,
): { shared: LikeC4SharedServices; likec4: LikeC4Services }
export function createLanguageServices<I1, I extends I1 & LikeC4Services>(
  context: Partial<LanguageServicesContext>,
  module: Module<I, I1> | undefined,
): { shared: LikeC4SharedServices; likec4: I }
export function createLanguageServices<I1, I2, I extends I1 & I2 & LikeC4Services>(
  context: Partial<LanguageServicesContext>,
  module: Module<I, I1>,
  module2: Module<I, I2>,
): { shared: LikeC4SharedServices; likec4: I }
export function createLanguageServices<I1, I2, I3, I extends I1 & I2 & I3 & LikeC4Services>(
  context: Partial<LanguageServicesContext>,
  module: Module<I, I1>,
  module2: Module<I, I2>,
  module3: Module<I, I3>,
): { shared: LikeC4SharedServices; likec4: I }
export function createLanguageServices<I1, I2, I3, I extends I1 & I2 & I3 & LikeC4Services>(
  context: Partial<LanguageServicesContext>,
  module?: Module<I, I1>,
  module2?: Module<I, I2>,
  module3?: Module<I, I3>,
): { shared: LikeC4SharedServices; likec4: I } {
  const shared = createSharedServices(context)
  const modules = [
    createDefaultModule({ shared }),
    LikeC4GeneratedModule,
    createLikeC4Module({
      ...NoMCPServer,
      ...NoFileSystem,
      ...NoLikeC4ManualLayouts,
      ...context,
    }),
    module,
    module2,
    module3,
  ].reduce(_merge, {}) as unknown as Module<I>

  const likec4 = inject(modules)
  shared.ServiceRegistry.register(likec4)
  registerValidationChecks(likec4)

  if (!context.connection) {
    // We don't run inside a language server
    // Therefore, initialize the configuration provider instantly
    void shared.workspace.ConfigurationProvider.initialized({})
  } else {
    onNextTick(() => likec4.Rpc.init())
  }

  return { shared, likec4 }
}

export function createSharedServices(context: Partial<LanguageServicesContext> = {}): LikeC4SharedServices {
  const moduleContext = {
    ...NoMCPServer,
    ...NoFileSystem,
    ...NoLikeC4ManualLayouts,
    ...context,
  }
  return inject(
    createDefaultSharedModule(moduleContext),
    LikeC4GeneratedSharedModule,
    createLikeC4SharedModule(moduleContext),
  )
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
