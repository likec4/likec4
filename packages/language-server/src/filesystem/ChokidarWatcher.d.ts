import type { LikeC4SharedServices } from '../module';
import type { FileSystemWatcher, FileSystemWatcherModuleContext } from './types';
export declare const WithChokidarWatcher: FileSystemWatcherModuleContext;
/**
 * A no-op file system watcher.
 */
export declare class ChokidarFileSystemWatcher implements FileSystemWatcher {
    protected services: LikeC4SharedServices;
    private watcher?;
    private queue;
    constructor(services: LikeC4SharedServices);
    watch(folder: string): void;
    dispose(): Promise<void>;
    private createWatcher;
    private enqueueFileOp;
    private onAddOrChange;
    private onRemove;
    private onRemoveDir;
}
