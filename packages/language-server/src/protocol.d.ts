import type { LikeC4ProjectJsonConfig } from '@likec4/config';
import type { ComputedLikeC4ModelData, DeploymentFqn, DiagramView, Fqn, LayoutedLikeC4ModelData, LayoutedProjectsView, NonEmptyArray, ProjectId, RelationId, ViewChange, ViewId } from '@likec4/core';
import type { DiagnosticSeverity, DocumentUri, Location, Position, Range, URI } from 'vscode-languageserver-types';
export declare namespace DidChangeModelNotification {
    const type: any;
    type Type = typeof type;
}
/**
 * Triggered by the language server when projects changed
 * (number of projects changed, names changed, etc)
 */
export declare namespace DidChangeProjectsNotification {
    const type: any;
    type Type = typeof type;
}
/**
 * When the snapshot of a manual layout changes
 * Send by the editor to the language server
 */
export declare namespace DidChangeSnapshotNotification {
    type Params = {
        snapshotUri: DocumentUri;
    };
    const Method: "likec4/onDidChangeSnapshot";
    const type: any;
    type Type = typeof type;
}
/**
 * When server requests to open a likec4 preview panel
 * (available only in the editor).
 * (not the best place, but seems to be working)
 */
export declare namespace DidRequestOpenViewNotification {
    type Params = {
        viewId: ViewId;
        projectId: ProjectId;
    };
    const type: any;
    type Type = typeof type;
}
/**
 * Request to fetch the computed model data
 * If LSP has multiple projects, the projectId is required.
 * otherwise throws an error.
 */
export declare namespace FetchComputedModel {
    type Params = {
        projectId?: string | undefined;
        cleanCaches?: boolean | undefined;
    };
    type Res = {
        model: ComputedLikeC4ModelData | null;
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to fetch all views of all projects
 */
export declare namespace FetchViewsFromAllProjects {
    type Res = {
        views: Array<{
            id: ViewId;
            title: string;
            projectId: ProjectId;
        }>;
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to fetch the layouted model data
 * If LSP has multiple projects, the projectId is required.
 * otherwise throws an error.
 */
export declare namespace FetchLayoutedModel {
    type Params = {
        projectId?: string | undefined;
    };
    type Res = {
        model: LayoutedLikeC4ModelData | null;
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to layout a view.
 * If LSP has multiple projects, the projectId is required.
 */
export declare namespace LayoutView {
    type Params = {
        viewId: ViewId;
        projectId?: string | undefined;
        layoutType?: 'auto' | 'manual' | undefined;
    };
    type Res = {
        result: {
            dot: string;
            diagram: DiagramView;
        } | null;
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to validate all views
 * If projects ID is provided, it will validate only the views of that project.
 */
export declare namespace ValidateLayout {
    type Params = {
        projectId?: string;
    };
    type Res = {
        result: {
            uri: string;
            viewId: ViewId;
            message: string;
            severity: DiagnosticSeverity;
            range: {
                start: Position;
                end: Position;
            };
        }[] | null;
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to reload projects.
 */
export declare namespace ReloadProjects {
    type Params = never;
    type Res = void;
    const req: any;
    type Req = typeof req;
}
/**
 * Fetch all non-empty projects.
 */
export declare namespace FetchProjects {
    type Params = never;
    type Res = {
        projects: {
            [projectId: ProjectId]: {
                folder: URI;
                config: {
                    name: string;
                    title?: string | undefined;
                };
                docs: NonEmptyArray<DocumentUri>;
            };
        };
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request from the client to register a project.
 */
export declare namespace RegisterProject {
    type Params = {
        folderUri: URI;
        config: LikeC4ProjectJsonConfig;
        configUri?: never;
    } | {
        configUri: URI;
        folderUri?: never;
        config?: never;
    };
    type Res = {
        id: ProjectId;
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to build documents.
 */
export declare namespace BuildDocuments {
    type Params = {
        docs: DocumentUri[];
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to locate an element, relation, deployment or view.
 * If LSP has multiple projects, the projectId is required.
 */
export declare namespace Locate {
    type Params = 
    /**
     * Locate an element by its fqn
     */
    {
        element: Fqn;
        projectId?: string | undefined;
        property?: string;
    }
    /**
     * Locate a relation by its id
     */
     | {
        projectId?: string | undefined;
        relation: RelationId;
    }
    /**
     * Locate a deployment by its fqn
     */
     | {
        deployment: DeploymentFqn;
        projectId?: string | undefined;
        property?: string;
    }
    /**
     * Locate a step in a dynamic view by its astPath
     */
     | {
        view: ViewId;
        astPath: string;
        projectId?: string | undefined;
    }
    /**
     * Locate a view by its id
     */
     | {
        view: ViewId;
        projectId?: string | undefined;
    };
    type Res = Location | null;
    const req: any;
    type Req = typeof req;
}
/**
 * Request to change the view
 * If LSP has multiple projects, the projectId is required.
 */
export declare namespace ChangeView {
    type Params = {
        viewId: ViewId;
        change: ViewChange;
        projectId?: string | undefined;
    };
    type Res = {
        success: true;
        location: Location | null;
    } | {
        success: false;
        location?: Location | null;
        error: string;
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to fetch telemetry metrics
 */
export declare namespace FetchTelemetryMetrics {
    type Res = {
        metrics: null | {
            elementKinds: number;
            deploymentKinds: number;
            relationshipKinds: number;
            tags: number;
            customColors: number;
            elements: number;
            deploymentNodes: number;
            relationships: number;
            views: number;
            projects: number;
        };
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to fetch all tags of a document
 */
export declare namespace GetDocumentTags {
    type Params = {
        documentUri: DocumentUri;
    };
    type Res = {
        /**
         * Used tags in the document
         */
        tags: Array<{
            name: string;
            range: Range;
            color: string;
            isSpecification?: boolean;
        }>;
    };
    const req: any;
    type Req = typeof req;
}
/**
 * Request to fetch projects overview diagram
 */
export declare namespace FetchProjectsOverview {
    type Res = {
        projectsView: LayoutedProjectsView | null;
    };
    const req: any;
    type Req = typeof req;
}
