import { NoFileSystem, NoFileSystemWatcher, NoLikeC4ManualLayouts } from './filesystem/noop'
import { NoMCPServer } from './mcp/noop'
import { createLanguageServices } from './module'

export type {
  DocumentParser,
  FqnIndex,
  LikeC4ModelBuilder,
  LikeC4ModelLocator,
  LikeC4ModelParser,
  ViewLocateResult,
} from './model'

export type { LikeC4LanguageServices } from './LikeC4LanguageServices'

export type {
  LanguageServicesContext,
  LikeC4AddedServices,
  LikeC4Services,
  LikeC4SharedServices,
} from './module'

export type { LikeC4Views } from './views'

export type {
  LangiumDocuments,
  LikeC4WorkspaceManager,
  Project,
  ProjectData,
  ProjectsManager,
} from './workspace'

export {
  createLanguageServices,
  NoFileSystem,
  NoFileSystemWatcher,
  NoLikeC4ManualLayouts,
  NoMCPServer,
}

export type {
  FileSystemModuleContext,
  FileSystemProvider,
  FileSystemWatcher,
  FileSystemWatcherModuleContext,
  LikeC4ManualLayouts,
  LikeC4ManualLayoutsModuleContext,
} from './filesystem'
