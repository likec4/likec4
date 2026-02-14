import { _layout, applyManualLayout, calcDriftsFromSnapshot } from '@likec4/core';
import { computeAdhocView } from '@likec4/core/compute-view';
import { loggable } from '@likec4/log';
import { interruptAndCheck } from 'langium';
import { isTruthy, values } from 'remeda';
import { logger as rootLogger, logWarnError } from '../logger';
import { performanceMark } from '../utils';
const viewsLogger = rootLogger.getChild('views');
export class DefaultLikeC4Views {
    services;
    cache = new WeakMap();
    /**
     * Set of viewIds with reported errors
     * value is `${projectId}-${viewId}`
     */
    viewsWithReportedErrors = new Set();
    ModelBuilder;
    constructor(services) {
        this.services = services;
        this.ModelBuilder = services.likec4.ModelBuilder;
        services.shared.workspace.WorkspaceManager.onForceCleanCache(() => {
            this.cache = new WeakMap();
        });
    }
    get layouter() {
        return this.services.likec4.Layouter;
    }
    async computedViews(projectId, cancelToken) {
        const likeC4Model = await this.ModelBuilder.computeModel(projectId, cancelToken);
        return values(likeC4Model.$data.views);
    }
    async _layoutAllViews(likeC4Model, cancelToken) {
        const views = values(likeC4Model.$data.views);
        if (views.length === 0) {
            return [];
        }
        const m0 = performanceMark();
        const projectId = likeC4Model.project.id;
        const logger = viewsLogger.getChild(projectId);
        logger.debug `layoutAll: ${views.length} views`;
        const tasks = [];
        const styles = likeC4Model.$styles;
        const results = [];
        //
        for (const view of views) {
            let cached = this.cache.get(view);
            if (cached) {
                logger.debug `layout ${view.id} from cache`;
                results.push(cached);
                continue;
            }
            tasks.push({
                view,
                styles,
            });
        }
        if (tasks.length > 0) {
            await this.layouter.batchLayout({
                batch: tasks,
                cancelToken,
                onSuccess: (task, result) => {
                    results.push(this.viewSucceed(task.view, likeC4Model, result));
                },
                onError: (task, error) => {
                    logger.warn(`Fail layout view ${task.view.id}`, { error });
                },
            });
        }
        if (cancelToken && cancelToken.isCancellationRequested) {
            await interruptAndCheck(cancelToken);
        }
        if (results.length !== views.length) {
            logger.warn `layouted ${results.length} of ${views.length} views in ${m0.pretty}`;
        }
        else if (results.length > 0) {
            logger.debug `layouted all ${results.length} views in ${m0.pretty}`;
        }
        return results;
    }
    async layoutAllViews(projectId, cancelToken) {
        const likeC4Model = await this.ModelBuilder.computeModel(projectId, cancelToken);
        return await this._layoutAllViews(likeC4Model, cancelToken);
    }
    async layoutView({ viewId, layoutType, projectId, cancelToken, }) {
        const model = await this.ModelBuilder.computeModel(projectId, cancelToken);
        const view = model.findView(viewId)?.$view;
        projectId = model.project.id;
        const logger = viewsLogger.getChild(projectId);
        if (!view) {
            logger.warn `layoutView ${viewId} not found`;
            const snapshot = model.findManualLayout(viewId);
            if (snapshot) {
                logger.debug `found manual layout for ${viewId}`;
                let diagram = { ...snapshot };
                diagram.drifts = [
                    'not-exists',
                ];
                diagram._layout = 'manual';
                return {
                    diagram: diagram,
                    dot: '# manual layout',
                };
            }
            return null;
        }
        try {
            const m0 = performanceMark();
            const out = this.cache.get(view) ?? await this.layouter.layout({
                view,
                styles: model.$styles,
            });
            if (this.cache.has(view)) {
                logger.debug `layout ${viewId} from cache`;
            }
            else {
                this.viewSucceed(view, model, out);
                logger.debug(`layout {viewId} in ${m0.pretty}`, { viewId });
            }
            if (isTruthy(layoutType)) {
                return {
                    dot: out.dot,
                    diagram: this.withLayoutType(out.diagram, model, layoutType),
                };
            }
            return out;
        }
        catch (e) {
            const errMessage = loggable(e);
            logger.warn(errMessage);
            this.reportViewError(view, projectId, errMessage);
            return Promise.reject(e);
        }
    }
    async diagrams(projectId, cancelToken) {
        const likeC4Model = await this.ModelBuilder.computeModel(projectId, cancelToken);
        const layouted = await this._layoutAllViews(likeC4Model, cancelToken);
        return layouted.map(({ diagram }) => {
            // Apply manual layout if any
            return this.withLayoutType(diagram, likeC4Model, 'manual');
        });
    }
    async viewsAsGraphvizOut(projectId, cancelToken) {
        const KEY = 'All-LayoutedViews-DotWithSvg';
        const cache = this.services.shared.workspace.Cache;
        if (cache.has(KEY)) {
            return await Promise.resolve(cache.get(KEY));
        }
        const likeC4Model = await this.ModelBuilder.computeModel(projectId, cancelToken);
        const views = values(likeC4Model.$data.views);
        if (views.length === 0) {
            return [];
        }
        const tasks = views.map(async (view) => {
            const { dot, svg } = await this.layouter.svg({
                view,
                styles: likeC4Model.$styles,
            });
            return {
                id: view.id,
                dot,
                svg,
            };
        });
        const succeed = [];
        const settledResult = await Promise.allSettled(tasks);
        for (const result of settledResult) {
            if (result.status === 'fulfilled') {
                succeed.push(result.value);
            }
            else {
                logWarnError(result.reason);
            }
        }
        cache.set(KEY, succeed);
        return succeed;
    }
    /**
     * Open a view in the preview panel.
     */
    async openView(viewId, projectId) {
        await this.services.Rpc.openView({ viewId, projectId });
    }
    async adhocView(predicates, projectId) {
        viewsLogger.debug `layouting adhoc view...`;
        const likeC4Model = await this.ModelBuilder.computeModel(projectId);
        const view = computeAdhocView(likeC4Model, predicates);
        const { diagram } = await this.layouter.layout({
            view: {
                ...view,
                hash: '',
                _type: 'element',
            },
            styles: likeC4Model.$styles,
        });
        viewsLogger.debug `layouting adhoc view... done`;
        return diagram;
    }
    reportViewError(view, projectId, error) {
        const key = `${projectId}-${view.id}`;
        this.cache.delete(view);
        if (!this.viewsWithReportedErrors.has(key)) {
            this.services.shared.lsp.Connection?.window.showErrorMessage(`LikeC4: ${error}`);
            this.viewsWithReportedErrors.add(key);
        }
    }
    /**
     * Applies manual layout or calculates drifts from snapshot
     * if layoutType is specified
     */
    withLayoutType(layouted, likec4model, layoutType) {
        if (!layoutType) {
            return layouted;
        }
        const snapshot = likec4model.findManualLayout(layouted.id);
        if (!snapshot) {
            return layouted;
        }
        if (layoutType === 'manual') {
            if (layouted[_layout] === 'manual') {
                viewsLogger.error(`View ${layouted.id} already has manual layout, this should not happen`);
                return layouted;
            }
            return applyManualLayout(layouted, snapshot);
        }
        return calcDriftsFromSnapshot(layouted, snapshot);
    }
    viewSucceed(view, likec4model, result) {
        const projectId = likec4model.project.id;
        const key = `${projectId}-${view.id}`;
        this.viewsWithReportedErrors.delete(key);
        this.cache.set(view, result);
        return result;
    }
}
