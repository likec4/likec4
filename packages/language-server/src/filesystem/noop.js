import { LibIcons } from '../generated-lib/icons';
import { isLikeC4Builtin } from '../likec4lib';
export class NoopFileSystemProvider {
    scanProjectFiles() {
        return Promise.resolve([]);
    }
    scanDirectory() {
        return Promise.resolve([]);
    }
    readFile(uri) {
        if (isLikeC4Builtin(uri)) {
            return Promise.resolve(LibIcons);
        }
        throw new Error('No file system is available.');
    }
    readDirectory() {
        return Promise.resolve([]);
    }
    loadProjectConfig() {
        throw new Error('No file system is available.');
    }
    writeFile() {
        throw new Error('No file system is available.');
    }
    deleteFile() {
        throw new Error('No file system is available.');
    }
}
/**
 * A no-op file system watcher.
 */
export class NoopFileSystemWatcher {
    watch() {
        return;
    }
    dispose() {
        return Promise.resolve();
    }
}
export class NoopLikeC4ManualLayouts {
    read() {
        return Promise.resolve(null);
    }
    write() {
        return Promise.reject(new Error('NoopLikeC4ManualLayouts: write operation is not supported'));
    }
    remove() {
        return Promise.resolve(null);
    }
    clearCaches() {
    }
}
export const NoFileSystemWatcher = {
    fileSystemWatcher: () => new NoopFileSystemWatcher(),
};
export const NoFileSystem = {
    fileSystemProvider: () => new NoopFileSystemProvider(),
    ...NoFileSystemWatcher,
};
export const NoLikeC4ManualLayouts = {
    manualLayouts: () => new NoopLikeC4ManualLayouts(),
};
