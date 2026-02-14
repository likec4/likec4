import { type RelationshipsViewData } from '@likec4/core/compute-view';
import type { DiagramEdge, DiagramNode, DiagramView, ElementKind, Fqn, MarkdownOrString, ViewId } from '@likec4/core/types';
import type { LikeC4ViewModel } from '@likec4/core/model';
import type { RelationshipsBrowserTypes } from './_types';
export type LayoutRelationshipsViewResult = {
    subject: Fqn;
    subjectExistsInScope: boolean;
    nodes: LayoutRelationshipsViewResult.Node[];
    edges: LayoutRelationshipsViewResult.Edge[];
    bounds: DiagramView['bounds'];
};
export declare namespace LayoutRelationshipsViewResult {
    const Empty: ElementKind;
    type Node = Omit<DiagramNode, 'deploymentRef' | 'description' | 'inEdges' | 'outEdges'> & {
        description: MarkdownOrString | null;
        column: RelationshipsBrowserTypes.Column;
        ports: RelationshipsBrowserTypes.Ports;
        existsInCurrentView: boolean;
    };
    type Edge = Omit<DiagramEdge, 'description'> & {
        sourceFqn: Fqn;
        targetFqn: Fqn;
        sourceHandle: string;
        targetHandle: string;
        existsInCurrentView: boolean;
    };
}
export declare function layoutRelationshipsView(data: RelationshipsViewData, scope: LikeC4ViewModel | null): Omit<LayoutRelationshipsViewResult, 'subject'>;
export declare function useRelationshipsView(subject: Fqn, viewId: ViewId | null, scope: 'global' | 'view'): LayoutRelationshipsViewResult;
