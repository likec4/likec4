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
}

export interface FileSystemModuleContext extends FileSystemWatcherModuleContext {
  fileSystemProvider: (services: LangiumSharedCoreServices) => FileSystemProvider
}

export class NoopFileSystemProvider implements FileSystemProvider {
  scanProjectFiles(): Promise<FileSystemNode[]> {
    return Promise.resolve([])
  }

  readFile(): Promise<string> {
    throw new Error('No file system is available.')
  }

  readDirectory(): Promise<FileSystemNode[]> {
    return Promise.resolve([])
  }
}

export const NoopFileSystem: FileSystemModuleContext = {
  fileSystemProvider: () => new NoopFileSystemProvider(),
  ...noopFileSystemWatcher,
}
