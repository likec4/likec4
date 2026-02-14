import type { RelationshipsBrowserTypes } from './_types';
import { LayoutRelationshipsViewResult } from './layout';
export declare function viewToNodesEdge(view: Pick<LayoutRelationshipsViewResult, 'nodes' | 'edges'>): {
    xynodes: RelationshipsBrowserTypes.AnyNode[];
    xyedges: RelationshipsBrowserTypes.Edge[];
};
export declare function useViewToNodesEdges({ edges, nodes }: LayoutRelationshipsViewResult): {
    xynodes: RelationshipsBrowserTypes.AnyNode[];
    xyedges: RelationshipsBrowserTypes.Edge[];
};
