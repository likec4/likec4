import type { LikeC4ProjectConfig } from '@likec4/config'
import type { LayoutedView, ProjectId, ViewId } from '@likec4/core/types'
import type {
  AsyncDisposable,
  Disposable,
  FileSystemNode,
  FileSystemProvider as LangiumFileSystemProvider,
  URI,
} from 'langium'
import type { Location } from 'vscode-languageserver-types'
import type { LikeC4SharedServices } from '../module'
import type { Project } from '../workspace/ProjectsManager'

export interface FileNode extends FileSystemNode {
  readonly isFile: true
  readonly isDirectory: false
}

export interface FileSystemProvider extends LangiumFileSystemProvider {
  /**
   * Scans the project files for the given URI.
   * @returns The list of file system entries that are contained within the specified directory.
   */
  scanProjectFiles(folderUri: URI): Promise<FileNode[]>

  /**
   * Loads the project config from the given file.
   * @returns The project config.
   * @throws Error if the file does not exist or is not a valid project config.
   */
  loadProjectConfig(filepath: URI): Promise<LikeC4ProjectConfig>

  /**
   * Reads the directory and returns LikeC4 files.
   *
   * @param options.recursive If true, recursively reads the directory,
   * @param options.maxDepth Maximum depth to traverse when recursive is true (default: Infinity)
   */
  readDirectory(uri: URI, options?: { recursive?: boolean; maxDepth?: number }): Promise<FileNode[]>

  /**
   * Finds all files in the given directory, matching the given filter.
   */
  scanDirectory(
    directory: URI,
    filter: (filepath: string, isDirectory: boolean) => boolean,
  ): Promise<FileNode[]>

  /**
   * The canonical path of the given URI, with every symbolic link resolved.
   *
   * `undefined` when the path cannot be resolved, which includes a file that does not exist and a
   * URI of a scheme this provider cannot reach: the caller has to treat "unknown" and "outside"
   * differently.
   */
  realpath(uri: URI): Promise<string | undefined>

  /**
   * Writes the content to the file system.
   * Used by manual layouts.
   */
  writeFile(uri: URI, content: string): Promise<void>

  /**
   * Deletes the file from the file system.
   * Used by manual layouts.
   * @return true if the file was deleted, false if the file did not exist.
   */
  deleteFile(uri: URI): Promise<boolean>
}

export interface FileSystemModuleContext extends FileSystemWatcherModuleContext {
  fileSystemProvider: (services: LikeC4SharedServices) => FileSystemProvider
}

export interface FileSystemWatcherModuleContext {
  fileSystemWatcher: (services: LikeC4SharedServices) => FileSystemWatcher
}

export interface FileSystemWatcher extends AsyncDisposable {
  /**
   * Watches a folder for changes and triggers a reload of the documents and projects.
   */
  watch(folder: string): void
}

export interface LikeC4ManualLayoutsModuleContext {
  manualLayouts: (services: LikeC4SharedServices) => LikeC4ManualLayouts
}

/**
 * What a file referenced by `descriptionFile` resolved to.
 */
export type DescriptionFileContent =
  | { readonly content: string }
  | { readonly error: string }

/**
 * Files referenced with `descriptionFile`.
 *
 * The parser only records the references (the files are read when the model is built, not while
 * documents are parsed). Before the build, {@link LikeC4DescriptionFiles.read} reads the files the
 * project references, and the synchronous build takes their content with {@link LikeC4DescriptionFiles.get}.
 * When a referenced file changes, the projects that reference it are notified to be rebuilt.
 */
export interface LikeC4DescriptionFiles extends Disposable {
  /**
   * Reads the files referenced by the project (the ones not read yet), and remembers that the project
   * references them (previously referenced files are replaced).
   *
   * @param resolvedPaths the files referenced by the documents of the project, as the parser resolved them
   */
  read(projectId: ProjectId, resolvedPaths: Iterable<string>): Promise<void>

  /**
   * What the file resolved to for the project, `undefined` when it has not been read.
   */
  get(projectId: ProjectId, resolvedPath: string): DescriptionFileContent | undefined

  /**
   * Hash of the files referenced by the project and their content.
   * Changes when a referenced file changes, so the model built from them is not taken from cache.
   */
  hash(projectId: ProjectId): string

  /**
   * Resolves and reads a single reference (used by the validation to report the file that cannot be read).
   */
  readReference(ref: DescriptionFileReference): Promise<DescriptionFileContent>

  /**
   * Whether `uri` is a file referenced by some project, and so worth watching.
   */
  isReferenced(uri: URI): boolean

  /**
   * Registers a listener called when a referenced file changed (once for each project referencing it).
   */
  onDescriptionFileUpdate(listener: DescriptionFileUpdateListener): Disposable

  clearCaches(): void
}

/**
 * A file a document references with `descriptionFile`.
 */
export type DescriptionFileReference = {
  /** The document the property appears in */
  readonly docUri: URI
  readonly value: string
  readonly resolvedPath: string | null
}

export type DescriptionFileUpdateEvent = {
  readonly uri: URI
  readonly projectId: ProjectId
}

export type DescriptionFileUpdateListener = (event: DescriptionFileUpdateEvent) => void

export type ManualLayoutsSnapshot = {
  hash: string
  views: Record<ViewId, LayoutedView>
}

export type ManualLayoutUpdateEvent =
  | {
    updated: URI
    projectId: ProjectId
    viewId: ViewId
  }
  | {
    removed: URI
    projectId: ProjectId
    /**
     * Missing if triggered by FS event (file was deleted)
     */
    viewId?: ViewId
  }
export type ManualLayoutUpdateListener = (event: ManualLayoutUpdateEvent) => void

export interface LikeC4ManualLayouts extends Disposable {
  /**
   * Reads a single layouted view from the file system by its URI.
   * Used by the language server to get the current layout state.
   */
  readSnapshot(uri: URI): Promise<LayoutedView | null>
  read(project: Project): Promise<ManualLayoutsSnapshot | null>
  write(project: Project, layouted: LayoutedView): Promise<Location>
  remove(project: Project, view: ViewId): Promise<Location | null>
  clearCaches(): void
  /**
   * Registers a listener for manual layout updates.
   * The listener will be called when a manual layout is created, updated, or deleted.
   */
  onManualLayoutUpdate(listener: ManualLayoutUpdateListener): Disposable
}
