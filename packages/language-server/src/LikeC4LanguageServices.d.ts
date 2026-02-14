import type { LikeC4ProjectConfig } from '@likec4/config';
import { type LayoutedView, type NonEmptyArray, type ProjectId, type UnknownComputed, type UnknownLayouted } from '@likec4/core';
import { type LayoutedProjectsView } from '@likec4/core/compute-view';
import { LikeC4Model } from '@likec4/core/model';
import { URI } from 'langium';
import type { CancellationToken } from 'vscode-jsonrpc';
import type { Range } from 'vscode-languageserver-types';
import type { LikeC4ModelBuilder } from './model';
import type { LikeC4ModelChanges } from './model-change/ModelChanges';
import type { LikeC4Services } from './module';
import type { Locate } from './protocol';
import type { LikeC4Views } from './views/LikeC4Views';
import { ProjectsManager } from './workspace';
export interface LikeC4LanguageServices {
    readonly views: LikeC4Views;
    readonly builder: LikeC4ModelBuilder;
    readonly workspaceUri: URI;
    readonly projectsManager: ProjectsManager;
    readonly editor: LikeC4ModelChanges;
    /**
     * Returns all projects with relevant documents
     */
    projects(): NonEmptyArray<{
        id: ProjectId;
        folder: URI;
        title: string;
        documents: ReadonlyArray<URI>;
        config: Readonly<LikeC4ProjectConfig>;
    }>;
    /**
     * Returns project by ID, returns default project if no ID is specified
     */
    project(projectId?: ProjectId): {
        id: ProjectId;
        folder: URI;
        title: string;
        documents: ReadonlyArray<URI>;
        config: Readonly<LikeC4ProjectConfig>;
    };
    /**
     * Computes and layouts projects overview - a special diagram
     * that shows all projects and their relationships
     */
    projectsOverview(cancelToken?: CancellationToken): Promise<LayoutedProjectsView>;
    /**
     * Returns {@link LikeC4Model} of the specified project, with computed views {@link ComputedView}
     * Not ready for rendering, but enough to traverse model. Much faster than {@link layoutedModel}
     *
     * If no {@link project} is specified, returns for default project
     */
    computedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownComputed>>;
    /**
     * Returns {@link LikeC4Model} of the specified project, with layouted views {@link LayoutedView}
     * Ready for rendering. Applies manual layouts if available.
     *
     * If no {@link project} is specified, returns for default project
     */
    layoutedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownLayouted>>;
    /**
     * Returns diagrams (i.e. layouted views {@link LayoutedView}) for the specified project
     * Applies manual layouts if available.
     *
     * If no {@link project} is specified, returns diagrams for default project
     */
    diagrams(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LayoutedView[]>;
    getErrors(): Array<{
        message: string;
        line: number;
        range: Range;
        sourceFsPath: string;
    }>;
    /**
     * Returns the location of the specified element, relation, view or deployment element
     */
    locate(params: Locate.Params): Locate.Res;
    dispose(): Promise<void>;
}
/**
 * Public Language Services
 */
export declare class DefaultLikeC4LanguageServices implements LikeC4LanguageServices {
    private services;
    readonly builder: LikeC4ModelBuilder;
    readonly editor: LikeC4ModelChanges;
    readonly projectsManager: ProjectsManager;
    constructor(services: LikeC4Services);
    get views(): LikeC4Views;
    get workspaceUri(): URI;
    projects(): NonEmptyArray<{
        id: ProjectId;
        folder: URI;
        title: string;
        documents: ReadonlyArray<URI>;
        config: LikeC4ProjectConfig;
    }>;
    project(projectId?: ProjectId): {
        id: ProjectId;
        folder: URI;
        title: string;
        documents: ReadonlyArray<URI>;
        config: LikeC4ProjectConfig;
    };
    diagrams(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LayoutedView<UnknownLayouted>[]>;
    computedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownComputed>>;
    layoutedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownLayouted>>;
    projectsOverview(cancelToken?: CancellationToken): Promise<LayoutedProjectsView>;
    getErrors(): Array<{
        message: string;
        line: number;
        range: Range;
        sourceFsPath: string;
    }>;
    locate(params: Locate.Params): Locate.Res;
    dispose(): Promise<void>;
}
