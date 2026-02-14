import type { ComputedView, DiagramView, LayoutedView, LayoutType, ProjectId, ViewId } from '@likec4/core';
import { type AdhocViewPredicate } from '@likec4/core/compute-view';
import { type QueueGraphvizLayoter, GraphvizLayouter } from '@likec4/layouts';
import type { CancellationToken } from 'vscode-languageserver';
import type { LikeC4Services } from '../module';
export type GraphvizOut = {
    readonly dot: string;
    readonly diagram: LayoutedView;
};
type GraphvizSvgOut = {
    readonly id: ViewId;
    readonly dot: string;
    readonly svg: string;
};
type LayoutViewParams = {
    viewId: ViewId;
    /**
     * Type of layout to apply
     * - 'manual' - applies manual layout if any
     * - 'auto' - returns latest version with drifts from manual layout if any
     * - undefined - returns latest layout as is
     */
    layoutType?: LayoutType | undefined;
    projectId?: ProjectId | undefined;
    cancelToken?: CancellationToken | undefined;
};
export interface LikeC4Views {
    readonly layouter: GraphvizLayouter;
    /**
     * Returns computed views (i.e. views with predicates computed)
     *
     * @param projectId - project id, if not specified - uses the default project
     */
    computedViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<ComputedView[]>;
    /**
     * Layouts all views (ignoring any manual snapshots)
     *
     * @param projectId - project id, if not specified - uses the default project
     */
    layoutAllViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<GraphvizOut[]>;
    /**
     * Layouts a view.
     * If layoutType is 'manual' - applies manual layout if any.
     * If layoutType is 'auto' - returns latest version with drifts from manual layout if any
     * If not specified - returns latest layout as is
     *
     * If view not found in model, but there is a snapshot - it will be returned (with empty DOT)
     */
    layoutView(params: LayoutViewParams): Promise<GraphvizOut | null>;
    /**
     * Returns diagrams.
     * If diagram has manual layout, it will be used.
     * @param projectId - project id, if not specified - uses the default project
     */
    diagrams(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<DiagramView>>;
    /**
     * Returns all layouted views as Graphviz output (i.e. views with layout computed)
     * @param projectId - project id, if not specified - uses the default project
     */
    viewsAsGraphvizOut(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<GraphvizSvgOut>>;
    /**
     * Open view in the preview panel.
     * (works only if running as a vscode extension)
     *
     * @param projectId - project id, if not specified - uses the default project
     */
    openView(viewId: ViewId, projectId?: ProjectId | undefined): Promise<void>;
    /**
     * Computes and layouts an adhoc view (not defined in the model)
     *
     * @param projectId - project id, if not specified - uses the default project
     */
    adhocView(predicates: AdhocViewPredicate[], projectId?: ProjectId | undefined): Promise<LayoutedView>;
}
export declare class DefaultLikeC4Views implements LikeC4Views {
    private services;
    private cache;
    /**
     * Set of viewIds with reported errors
     * value is `${projectId}-${viewId}`
     */
    private viewsWithReportedErrors;
    private ModelBuilder;
    constructor(services: LikeC4Services);
    get layouter(): QueueGraphvizLayoter;
    computedViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<ComputedView[]>;
    private _layoutAllViews;
    layoutAllViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<GraphvizOut[]>;
    layoutView({ viewId, layoutType, projectId, cancelToken, }: LayoutViewParams): Promise<GraphvizOut | null>;
    diagrams(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<LayoutedView>>;
    viewsAsGraphvizOut(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<GraphvizSvgOut>>;
    /**
     * Open a view in the preview panel.
     */
    openView(viewId: ViewId, projectId: ProjectId): Promise<void>;
    adhocView(predicates: AdhocViewPredicate[], projectId?: ProjectId | undefined): Promise<LayoutedView>;
    private reportViewError;
    /**
     * Applies manual layout or calculates drifts from snapshot
     * if layoutType is specified
     */
    private withLayoutType;
    private viewSucceed;
}
export {};
