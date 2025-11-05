import type { LikeC4ProjectConfig } from '@likec4/config'
import type { FilterPredicate } from 'fdir'
import type {
  FileSystemNode,
  FileSystemProvider as LangiumFileSystemProvider,
  LangiumSharedCoreServices,
} from 'langium'
import { URI } from 'vscode-uri'
import { type FileSystemWatcherModuleContext, noopFileSystemWatcher } from './FileSystemWatcher'

export type { FileSystemWatcher } from './FileSystemWatcher'

export interface FileSystemProvider extends LangiumFileSystemProvider {
  /**
   * Scans the project files for the given URI.
   * @returns The list of file system entries that are contained within the specified directory.
   */
  scanProjectFiles(folderUri: URI): Promise<FileSystemNode[]>

  /**
   * Loads the project config from the given file.
   * @returns The project config.
   */
  loadProjectConfig(filepath: URI): Promise<LikeC4ProjectConfig>

  /**
   * Reads the directory information for the given URI.
   * @param options.recursive If true, recursively reads the directory,
   * @default true
   */
  readDirectory(uri: URI, options?: { recursive?: boolean }): Promise<FileSystemNode[]>

  /**
   * Finds all files in the given directory, matching the given filter.
   */
  scanDirectory(directory: URI, filter: (filepath: string) => boolean): Promise<FileSystemNode[]>

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
  fileSystemProvider: (services: LangiumSharedCoreServices) => FileSystemProvider
}

export class NoopFileSystemProvider implements FileSystemProvider {
  scanProjectFiles(): Promise<FileSystemNode[]> {
    return Promise.resolve([])
  }
  scanDirectory(): Promise<FileSystemNode[]> {
    return Promise.resolve([])
  }

  readFile(): Promise<string> {
    throw new Error('No file system is available.')
  }

  readDirectory(): Promise<FileSystemNode[]> {
    return Promise.resolve([])
  }

  loadProjectConfig(): Promise<LikeC4ProjectConfig> {
    throw new Error('No file system is available.')
  }

  writeFile(): Promise<void> {
    throw new Error('No file system is available.')
  }

  deleteFile(): Promise<boolean> {
    throw new Error('No file system is available.')
  }
}

export const NoopFileSystem: FileSystemModuleContext = {
  fileSystemProvider: () => new NoopFileSystemProvider(),
  ...noopFileSystemWatcher,
}
