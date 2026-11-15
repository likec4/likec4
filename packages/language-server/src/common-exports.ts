import { NoFileSystem, NoFileSystemWatcher, NoLikeC4ManualLayouts } from './filesystem/noop'
import { createLanguageServices } from './module'

export type {
  DocumentParser,
  FqnIndex,
  LikeC4ModelBuilder,
  LikeC4ModelLocator,
  LikeC4ModelParser,
  ViewLocateResult,
} from './model'

export type { ast } from './ast'

export type {
  DependenciesModuleContext,
  DependencyCacheDirParams,
  DependencyCacheEntry,
  DependencyInstaller,
  DependencyInstallOptions,
  DependencyInstallResult,
  DependencyState,
  DependencyStates,
  DependencyStatus,
  DependencyStorage,
  DependencyVersionRecord,
  GitDependencyInstance,
  GitDependencySource,
} from './dependencies'
export type { FormatOptions, LikeC4LanguageServices } from './LikeC4LanguageServices'

export type {
  ApplyEditsResult,
  DiffAction,
  DocumentChange,
  LikeC4ModelDiffs,
  LikeC4ModelEdits,
  LikeC4RemovalImpact,
  ModelEditPreview,
  ModelEditRecord,
  ModelEditRequest,
  ModelEditResult,
  ReferenceKind,
  RemainingError,
  RemovalImpactReference,
  RemovalImpactReport,
  SafeDeleteOptions,
} from './model-diff'

export type {
  LanguageServicesContext,
  LikeC4AddedServices,
  LikeC4Services,
  LikeC4SharedServices,
} from './module'

export { WithWasmGraphviz } from './views'
export type { LayoutViewParams, LikeC4Views, LikeC4ViewsModuleContext } from './views'

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
}

export { documentSourceUri } from './workspace/dependency-uri'

export {
  DEPENDENCIES_CACHE_SUBDIR,
  dependencyCacheDir,
  LIKEC4_CACHE_DIR_ENV,
  likec4CacheDir,
  NoDependencies,
  UnsupportedDependencyInstaller,
} from './dependencies'

export type {
  FileSystemModuleContext,
  FileSystemProvider,
  FileSystemWatcher,
  FileSystemWatcherModuleContext,
  LikeC4ManualLayouts,
  LikeC4ManualLayoutsModuleContext,
} from './filesystem'
