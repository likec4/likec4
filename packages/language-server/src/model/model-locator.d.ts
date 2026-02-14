import type * as c4 from '@likec4/core';
import type { Cancellation } from 'langium';
import type { Location, Range } from 'vscode-languageserver-types';
import { URI } from 'vscode-uri';
import type { ParsedAstElement, ParsedAstView, ParsedLikeC4LangiumDocument } from '../ast';
import { ast } from '../ast';
import type { LikeC4Services } from '../module';
export type ViewLocateResult = {
    doc: ParsedLikeC4LangiumDocument;
    view: ParsedAstView;
    viewAst: ast.LikeC4View;
};
export declare class LikeC4ModelLocator {
    private services;
    private fqnIndex;
    private deploymentsIndex;
    private langiumDocuments;
    private parser;
    private projects;
    constructor(services: LikeC4Services);
    private documents;
    getParsedElement(...args: [ast.Element] | [c4.Fqn] | [c4.Fqn, c4.ProjectId]): ParsedAstElement | null;
    locateElement(fqn: c4.Fqn, projectId?: c4.ProjectId | undefined): Location | null;
    locateDeploymentElement(deploymentFqn: c4.DeploymentFqn, projectId?: c4.ProjectId | undefined): Location | null;
    locateRelation(relationId: c4.RelationId, projectId?: c4.ProjectId): Location | null;
    locateViewAst(viewId: c4.ViewId, projectId?: c4.ProjectId | undefined): null | ViewLocateResult;
    locateView(viewId: c4.ViewId, projectId?: c4.ProjectId): Location | null;
    locateDocumentTags(documentUri: URI, cancelToken?: Cancellation.CancellationToken): Promise<Array<{
        name: string;
        color: string;
        range: Range;
        isSpecification: boolean;
    }>>;
    locateDynamicViewStep(params: {
        view: c4.ViewId;
        astPath: string;
        projectId?: c4.ProjectId | undefined;
    }): Location | null;
}
