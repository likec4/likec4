import type {
  DefaultSharedModuleContext,
  LangiumServices,
  LangiumSharedServices,
  Module, PartialLangiumServices, PartialLangiumSharedServices
} from 'langium'
import {
  createDefaultModule, inject, createDefaultSharedModule
} from 'langium'
import type { Constructor } from 'type-fest'
import { LikeC4GeneratedModule, LikeC4GeneratedSharedModule } from './generated/module'
import { LikeC4ScopeComputation, LikeC4ScopeProvider } from './references'
import { FqnIndex, LikeC4ModelBuilder } from './model'
import { registerValidationChecks } from './validation'
import { LikeC4DocumentSymbolProvider, LikeC4SemanticTokenProvider } from './lsp'

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface LikeC4AddedServices {
  likec4: {
    FqnIndex: FqnIndex,
    ModelBuilder: LikeC4ModelBuilder,
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
    // Model: bind(LikeC4Model),
    // Model: bind(LikeC4Model),
    // SpecIndex: bind(LikeC4SpecIndex),
    // Validator: bind(LikeC4Validator)
  },
  lsp: {
    DocumentSymbolProvider: bind(LikeC4DocumentSymbolProvider),
    SemanticTokenProvider: bind(LikeC4SemanticTokenProvider)
  },
  //   HoverProvider: bind(LikeC4HoverProvider),
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
  lsp: {
    // CodeLensProvider: (services) => new LikeC4CodeLensProvider(services)
  }
}

export function createLanguageServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices,
  likec4: LikeC4Services
} {
  // const connection = context.connection
  // if (connection) {
  //   logger.log = connection.console.log.bind(connection.console)
  //   logger.info = connection.console.info.bind(connection.console)
  //   logger.warn = connection.console.warn.bind(connection.console)
  //   logger.error = connection.console.error.bind(connection.console)
  //   logger.debug = connection.tracer.log.bind(connection.tracer)
  //   logger.trace = connection.tracer.log.bind(connection.tracer)
  // }

  const shared = inject(
    createDefaultSharedModule(context),
    LikeC4SharedModule,
  )
  const likec4 = inject(
    createDefaultModule({ shared }),
    LikeC4GeneratedModule,
    LikeC4Module
  )
  shared.ServiceRegistry.register(likec4)
  registerValidationChecks(likec4)
  // registerProtocolHandlers(likec4)
  return { shared, likec4 }
}
