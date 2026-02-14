import type { AnyAux, DiagramEdge, DiagramNode, DiagramView, Fqn, MarkdownOrString, RelationId } from '@likec4/core/types';
import type { LikeC4ViewModel } from '@likec4/core/model';
import type { Except } from 'type-fest';
import type { RelationshipDetailsTypes } from './_types';
import type { RelationshipDetailsViewData } from './compute';
export type LayoutResult = {
    nodes: LayoutResult.Node[];
    edges: LayoutResult.Edge[];
    bounds: DiagramView['bounds'];
};
export declare namespace LayoutResult {
    type Node = Except<DiagramNode, 'modelRef' | 'description' | 'deploymentRef' | 'inEdges' | 'outEdges'> & {
        description: MarkdownOrString | null;
        modelRef: Fqn;
        column: RelationshipDetailsTypes.Column;
        ports: RelationshipDetailsTypes.Ports;
    };
    type Edge = Except<DiagramEdge, 'relations' | 'description'> & {
        relationId: RelationId;
        sourceHandle: string;
        targetHandle: string;
        description: MarkdownOrString | null;
    };
}
export declare function layoutRelationshipDetails(data: RelationshipDetailsViewData, scope: LikeC4ViewModel<AnyAux> | null): LayoutResult;
