import type { LikeC4ProjectConfig } from '@likec4/config';
import type { URI } from 'langium';
import type { FileNode, FileSystemModuleContext, FileSystemProvider, FileSystemWatcher, FileSystemWatcherModuleContext, LikeC4ManualLayouts, LikeC4ManualLayoutsModuleContext } from './types';
export declare class NoopFileSystemProvider implements FileSystemProvider {
    scanProjectFiles(): Promise<FileNode[]>;
    scanDirectory(): Promise<FileNode[]>;
    readFile(uri: URI): Promise<string>;
    readDirectory(): Promise<FileNode[]>;
    loadProjectConfig(): Promise<LikeC4ProjectConfig>;
    writeFile(): Promise<void>;
    deleteFile(): Promise<boolean>;
}
/**
 * A no-op file system watcher.
 */
export declare class NoopFileSystemWatcher implements FileSystemWatcher {
    watch(): void;
    dispose(): Promise<void>;
}
export declare class NoopLikeC4ManualLayouts implements LikeC4ManualLayouts {
    read(): Promise<any>;
    write(): Promise<never>;
    remove(): Promise<any>;
    clearCaches(): void;
}
export declare const NoFileSystemWatcher: FileSystemWatcherModuleContext;
export declare const NoFileSystem: FileSystemModuleContext;
export declare const NoLikeC4ManualLayouts: LikeC4ManualLayoutsModuleContext;
