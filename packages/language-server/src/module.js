import { onNextTick } from '@likec4/core/utils';
import { GraphvizWasmAdapter, QueueGraphvizLayoter } from '@likec4/layouts';
import { DocumentState, inject, WorkspaceCache } from 'langium';
import { createDefaultModule, createDefaultSharedModule } from 'langium/lsp';
import { LikeC4DocumentationProvider } from './documentation';
import { NoFileSystem, NoLikeC4ManualLayouts } from './filesystem/noop';
import { LikeC4Formatter } from './formatting/LikeC4Formatter';
import { LikeC4GeneratedModule, LikeC4GeneratedSharedModule, } from './generated/module';
import { DefaultLikeC4LanguageServices } from './LikeC4LanguageServices';
import { LikeC4CodeActionProvider, LikeC4CodeLensProvider, LikeC4CompletionProvider, LikeC4DocumentHighlightProvider, LikeC4DocumentLinkProvider, LikeC4DocumentSymbolProvider, LikeC4HoverProvider, LikeC4SemanticTokenProvider, } from './lsp';
import { NoMCPServer } from './mcp/noop';
import { DefaultLikeC4ModelBuilder, DeploymentsIndex, FqnIndex, LikeC4ModelLocator, LikeC4ModelParser, LikeC4ValueConverter, } from './model';
import { LikeC4ModelChanges } from './model-change/ModelChanges';
import { LikeC4NameProvider, LikeC4ScopeComputation, LikeC4ScopeProvider, } from './references';
import { Rpc } from './Rpc';
import { NodeKindProvider, WorkspaceSymbolProvider, } from './shared';
import { LikeC4DocumentValidator, registerValidationChecks } from './validation';
import { DefaultLikeC4Views } from './views';
import { AstNodeDescriptionProvider, IndexManager, LangiumDocuments, LikeC4WorkspaceManager, ProjectsManager, } from './workspace';
export { NoFileSystem, NoLikeC4ManualLayouts } from './filesystem/noop';
export { NoMCPServer } from './mcp/noop';
function createLikeC4SharedModule(context) {
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
    });
}
function bind(Type) {
    return (services) => new Type(services);
}
/**
 * Most probably you don't need to use this function directly.
 * Use {@link createLanguageServices} instead.
 * @internal
 */
export function createLikeC4Module(context) {
    return ({
        documentation: {
            DocumentationProvider: bind(LikeC4DocumentationProvider),
        },
        validation: {
            DocumentValidator: bind(LikeC4DocumentValidator),
        },
        Rpc: bind(Rpc),
        mcp: {
            Server: (services) => context.mcpServer(services),
            ServerFactory: (services) => context.mcpServerFactory(services),
        },
        likec4: {
            LanguageServices: bind(DefaultLikeC4LanguageServices),
            Layouter: (_services) => {
                return new QueueGraphvizLayoter({
                    graphviz: new GraphvizWasmAdapter(),
                });
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
    });
}
export function createLanguageServices(context = {}, module, module2, module3) {
    const shared = createSharedServices(context);
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
    ].reduce(_merge, {});
    const likec4 = inject(modules);
    shared.ServiceRegistry.register(likec4);
    registerValidationChecks(likec4);
    if (!context.connection) {
        // We don't run inside a language server
        // Therefore, initialize the configuration provider instantly
        void shared.workspace.ConfigurationProvider.initialized({});
    }
    else {
        onNextTick(() => likec4.Rpc.init());
    }
    return { shared, likec4 };
}
/**
 * Most probably you don't need to use this function directly.
 * Use {@link createLanguageServices} instead.
 * @internal
 */
export function createSharedServices(context = {}) {
    const moduleContext = {
        ...NoMCPServer,
        ...NoFileSystem,
        ...NoLikeC4ManualLayouts,
        ...context,
    };
    return inject(createDefaultSharedModule(moduleContext), LikeC4GeneratedSharedModule, createLikeC4SharedModule(moduleContext));
}
// Copied from langium/src/dependency-injection.ts as it is not exported
function _merge(target, source) {
    if (source) {
        for (const [key, value2] of Object.entries(source)) {
            if (value2 !== undefined) {
                const value1 = target[key];
                if (value1 !== null && value2 !== null && typeof value1 === 'object' && typeof value2 === 'object') {
                    target[key] = _merge(value1, value2);
                }
                else {
                    target[key] = value2;
                }
            }
        }
    }
    return target;
}
