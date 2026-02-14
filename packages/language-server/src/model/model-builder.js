import { _stage, } from '@likec4/core';
import { computeView } from '@likec4/core/compute-view';
import { LikeC4Model } from '@likec4/core/model';
import { loggable } from '@likec4/log';
import { deepEqual as eq } from 'fast-equals';
import { Disposable, DocumentState, interruptAndCheck, } from 'langium';
import { filter, hasAtLeast, identity, map, mapToObj, piped, values, } from 'remeda';
import { isNotLikeC4Builtin } from '../likec4lib';
import { logger as mainLogger } from '../logger';
import { ADisposable, performanceMark } from '../utils';
import { assignNavigateTo } from '../view-utils';
import { buildModelData } from './builder/buildModel';
const parsedWithoutImportsCacheKey = (projectId) => `parsed-without-imports-${projectId}`;
const parsedModelCacheKey = (projectId) => `parsed-model-${projectId}`;
const computedModelCacheKey = (projectId) => `computed-model-${projectId}`;
const builderLogger = mainLogger.getChild('builder');
export class DefaultLikeC4ModelBuilder extends ADisposable {
    projects;
    parser;
    listeners = [];
    cache;
    DocumentBuilder;
    manualLayouts;
    mutex;
    constructor(services) {
        super();
        this.projects = services.shared.workspace.ProjectsManager;
        this.parser = services.likec4.ModelParser;
        this.cache = services.shared.workspace.Cache;
        this.DocumentBuilder = services.shared.workspace.DocumentBuilder;
        this.mutex = services.shared.workspace.WorkspaceLock;
        this.manualLayouts = services.shared.workspace.ManualLayouts;
        this.onDispose(this.DocumentBuilder.onUpdate((_changed, deleted) => {
            if (deleted.length > 0) {
                this.notifyListeners(deleted);
            }
        }), services.shared.workspace.WorkspaceManager.onForceCleanCache(() => {
            this.clearCache();
        }));
        const filterValidatedDocs = piped((identity()), filter(d => isNotLikeC4Builtin(d) && !this.projects.isExcluded(d)), map(d => d.uri));
        this.onDispose(this.DocumentBuilder.onBuildPhase(DocumentState.Validated, (docs, _cancelToken) => {
            const validated = filterValidatedDocs(docs);
            if (validated.length > 0) {
                this.notifyListeners(validated);
            }
        }));
        builderLogger.debug `created`;
    }
    /**
     * WARNING:
     * This method is internal and should to be called only when all documents are known to be parsed.
     * Otherwise, the model may be incomplete.
     *
     * To avoid circular dependencies, we do not resolve imports here.
     */
    unsafeSyncParseModelData(projectId) {
        const cache = this.cache;
        const key = parsedWithoutImportsCacheKey(projectId);
        return cache.get(key, () => {
            const logger = builderLogger.getChild(projectId);
            try {
                const project = this.projects.getProject(projectId);
                const docs = this.documents(projectId);
                if (docs.length === 0) {
                    logger.debug `unsafeSyncParseModelData: skipped due to no documents`;
                    return null;
                }
                logger.debug `unsafeSyncParseModelData: completed`;
                return buildModelData(project, docs);
            }
            catch (err) {
                builderLogger.warn(`unsafeSyncParseModelData failed for project ${projectId}`, { err });
                return null;
            }
        });
    }
    /**
     * To avoid circular dependencies, first we parse all documents and then we join them.
     */
    unsafeSyncJoinedModelData(projectId) {
        const logger = builderLogger.getChild(projectId);
        const result = this.unsafeSyncParseModelData(projectId);
        if (!result) {
            return null;
        }
        if (result.imports.size === 0) {
            return result.data;
        }
        logger.debug `processing imports of ${projectId}`;
        const imports = [...result.imports.associations()].reduce((acc, [projectId, fqns]) => {
            if (fqns.size === 0) {
                return acc;
            }
            const anotherProject = this.unsafeSyncParseModelData(projectId);
            if (anotherProject) {
                const imported = [...fqns].flatMap(fqn => anotherProject.data.elements[fqn] ?? []);
                if (hasAtLeast(imported, 1)) {
                    acc[projectId] = structuredClone(imported);
                }
            }
            return acc;
        }, {});
        return {
            ...result.data,
            imports,
        };
    }
    async parseModel(projectId, cancelToken) {
        projectId = this.projects.ensureProjectId(projectId);
        const logger = builderLogger.getChild(projectId);
        const cache = this.cache;
        const t0 = performanceMark();
        return await this.mutex.read(async () => {
            if (cancelToken?.isCancellationRequested) {
                await interruptAndCheck(cancelToken);
            }
            const key = parsedModelCacheKey(projectId);
            if (cache.has(key)) {
                logger.debug `parseModel from cache`;
            }
            return cache.get(key, () => {
                const parsedModel = this.unsafeSyncJoinedModelData(projectId);
                if (!parsedModel) {
                    logger.debug `parseModel: returning EMPTY`;
                    return LikeC4Model.EMPTY.asParsed;
                }
                logger.debug `parseModel in ${t0.pretty}`;
                return LikeC4Model.create(parsedModel);
            });
        });
    }
    previousViews = {};
    /**
     * WARNING:
     * This method is internal and should to be called only when all documents are known to be parsed.
     * Otherwise, the model may be incomplete.
     *
     * @internal
     */
    unsafeSyncComputeModel(projectId, manualLayouts) {
        const cache = this.cache;
        const key = computedModelCacheKey(projectId) + (manualLayouts?.hash ?? '');
        return cache.get(key, () => {
            const logger = builderLogger.getChild(projectId);
            const parsedModelData = this.unsafeSyncJoinedModelData(projectId);
            if (!parsedModelData) {
                logger.debug `unsafeSyncComputeModel: returning EMPTY`;
                return LikeC4Model.EMPTY.asComputed;
            }
            const parsedModel = LikeC4Model.create(parsedModelData);
            const allViews = [];
            for (const view of values(parsedModelData.views)) {
                const result = computeView(view, parsedModel);
                if (!result.isSuccess) {
                    logger.warn(loggable(result.error));
                    continue;
                }
                if (manualLayouts?.views[view.id]) {
                    Object.assign(result.view, 
                    // satisfies enforces that the object has the property
                    { hasManualLayout: true });
                }
                allViews.push(result.view);
            }
            assignNavigateTo(allViews);
            const views = mapToObj(allViews, v => {
                const key = computedViewKey(projectId, v.id);
                const previous = this.previousViews[key];
                const view = previous && eq(v, previous) ? previous : v;
                this.previousViews[key] = view;
                return [v.id, view];
            });
            const data = {
                ...parsedModelData,
                manualLayouts: { ...manualLayouts?.views },
                [_stage]: 'computed',
                views,
            };
            logger.debug(`unsafeSyncComputeModel${manualLayouts ? ' with manual layouts' : ''}: completed`);
            return LikeC4Model.create(data);
        });
    }
    async computeModel(projectId, cancelToken) {
        projectId = this.projects.ensureProjectId(projectId);
        const logger = builderLogger.getChild(projectId);
        const t0 = performanceMark();
        return await this.mutex.read(async () => {
            if (cancelToken?.isCancellationRequested) {
                await interruptAndCheck(cancelToken);
            }
            const project = this.projects.getProject(projectId);
            const manualLayouts = await this.manualLayouts.read(project);
            const result = this.unsafeSyncComputeModel(projectId, manualLayouts);
            if (result === LikeC4Model.EMPTY) {
                logger.debug(`computeModel returned EMPTY`);
            }
            else if (t0.ms > 10) {
                logger.debug(`computeModel completed in ${t0.pretty}`);
            }
            return result;
        });
    }
    onModelParsed(callback) {
        this.listeners.push(callback);
        return Disposable.create(() => {
            const index = this.listeners.indexOf(callback);
            if (index >= 0) {
                this.listeners.splice(index, 1);
            }
        });
    }
    clearCache() {
        builderLogger.debug(`clearCache`);
        this.cache.clear();
        this.previousViews = {};
    }
    documents(projectId) {
        return this.parser.documents(projectId).toArray();
    }
    notifyListeners(docs) {
        for (const listener of this.listeners) {
            try {
                listener(docs);
            }
            catch (e) {
                builderLogger.warn(loggable(e));
            }
        }
    }
}
function computedViewKey(projectId, viewId) {
    return `computed-view-${projectId}-${viewId}`;
}
