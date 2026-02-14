import { isLikeC4Config } from '@likec4/config/node';
import chokidar from 'chokidar';
import { URI } from 'langium';
import { basename } from 'node:path';
import PQueue from 'p-queue';
import { logger as mainLogger } from '../logger';
import { isManualLayoutFile } from './LikeC4ManualLayouts';
import { hasLikeC4Ext } from './utils';
const logger = mainLogger.getChild('chokidar');
export const WithChokidarWatcher = {
    fileSystemWatcher: (services) => new ChokidarFileSystemWatcher(services),
};
const isAnyLikeC4File = (path) => {
    const filename = basename(path);
    return hasLikeC4Ext(filename) || isLikeC4Config(filename) || isManualLayoutFile(filename);
};
/**
 * A no-op file system watcher.
 */
export class ChokidarFileSystemWatcher {
    services;
    watcher;
    queue = new PQueue({ concurrency: 1, timeout: 5000 });
    constructor(services) {
        this.services = services;
    }
    watch(folder) {
        if (this.watcher) {
            logger.debug `add watching folder: ${folder}`;
            this.watcher.add(folder);
            return;
        }
        this.watcher = this.createWatcher(folder);
    }
    async dispose() {
        if (this.watcher) {
            const watcher = this.watcher;
            this.watcher = undefined;
            await watcher.close();
        }
        return;
    }
    createWatcher(folder) {
        logger.debug `create watcher for folder: ${folder}`;
        let watcher = chokidar.watch(folder, {
            ignored: [
                path => path.includes('node_modules') || path.includes('.git'),
                (path, stats) => !!stats?.isFile() && !isAnyLikeC4File(path),
            ],
            followSymlinks: true,
            ignoreInitial: true,
        });
        const onAddOrChange = (path, stats) => {
            if (stats?.isDirectory()) {
                return;
            }
            this.enqueueFileOp('addOrChange: ' + path, async () => {
                await this.onAddOrChange(path);
            });
        };
        const onRemove = (path, stats) => {
            if (stats?.isDirectory()) {
                return;
            }
            this.enqueueFileOp('remove: ' + path, async () => {
                await this.onRemove(path);
            });
        };
        watcher.on('add', onAddOrChange)
            .on('change', onAddOrChange)
            .on('unlink', onRemove)
            .on('unlinkDir', (path) => {
            this.enqueueFileOp('removeDir: ' + path, async () => {
                await this.onRemoveDir(path);
            });
        });
        return watcher;
    }
    enqueueFileOp(fileop, fn) {
        this.queue.add(async () => {
            try {
                await fn();
            }
            catch (error) {
                logger.warn(`Failed on {fileop}`, { fileop, error });
            }
        }).catch(error => {
            logger.error(`Error on {fileop}`, { fileop, error });
        });
    }
    async onAddOrChange(path) {
        const workspace = this.services.workspace;
        const filename = basename(path);
        const uri = URI.file(path);
        switch (true) {
            case isLikeC4Config(filename): {
                logger.debug `project file changed: ${path}`;
                workspace.ManualLayouts.clearCaches();
                await workspace.ProjectsManager.registerConfigFile(uri);
                break;
            }
            case hasLikeC4Ext(filename): {
                logger.debug `file changed: ${path}`;
                await workspace.DocumentBuilder.update([uri], []);
                break;
            }
            case isManualLayoutFile(filename): {
                logger.debug `manual layout file changed: ${path}`;
                workspace.ManualLayouts.clearCaches();
                const projectId = workspace.ProjectsManager.ownerProjectId(uri);
                await workspace.ProjectsManager.rebuildProject(projectId);
                break;
            }
            default: {
                logger.warn `Unknown file change: ${path}`;
            }
        }
    }
    async onRemove(path) {
        const workspace = this.services.workspace;
        const filename = basename(path);
        const uri = URI.file(path);
        switch (true) {
            case isLikeC4Config(filename): {
                logger.debug `project file removed: ${path}`;
                workspace.ManualLayouts.clearCaches();
                await workspace.ProjectsManager.reloadProjects();
                break;
            }
            case hasLikeC4Ext(filename): {
                logger.debug `file removed: ${path}`;
                await workspace.DocumentBuilder.update([], [uri]);
                break;
            }
            case isManualLayoutFile(filename): {
                logger.debug `manual layout file removed: ${path}`;
                const project = workspace.ProjectsManager.ownerProjectId(uri);
                workspace.ManualLayouts.clearCaches();
                await workspace.ProjectsManager.rebuildProject(project);
                break;
            }
            default: {
                logger.warn `Unknown file removal: ${path}`;
            }
        }
    }
    async onRemoveDir(path) {
        logger.debug `directory removed: ${path}`;
        const workspace = this.services.workspace;
        const projects = workspace.ProjectsManager.findOverlaped(path);
        if (projects.length > 0) {
            workspace.ManualLayouts.clearCaches();
            await workspace.ProjectsManager.reloadProjects();
        }
    }
}
