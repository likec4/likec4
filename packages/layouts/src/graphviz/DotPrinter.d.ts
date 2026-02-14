import type { LikeC4Styles } from '@likec4/core/styles';
import type { ComputedView, DeploymentFqn, EdgeId, Fqn, LikeC4StyleDefaults, NodeId, RelationshipColorValues, XYPoint } from '@likec4/core/types';
import { Graph } from '@likec4/core/utils/graphology';
import { type AttributeListModel, type EdgeAttributeKey, type EdgeModel, type NodeAttributeKey, type NodeModel, type RootGraphModel, type SubgraphModel } from 'ts-graphviz';
import type { DotSource } from './types';
export declare const DefaultEdgeStyle: RelationshipLineType;
type ViewToPrint = Pick<ComputedView, 'id' | 'nodes' | 'edges' | 'autoLayout'>;
type NodeOf<V extends ViewToPrint> = V['nodes'][number];
type EdgeOf<V extends ViewToPrint> = V['edges'][number];
export type ApplyManualLayoutData = {
    x: number;
    y: number;
    height: number;
    nodes: Array<{
        id: string;
        center: XYPoint;
        fixedsize?: {
            width: number;
            height: number;
        };
    }>;
    edges: Array<{
        id: string;
        dotpos: string;
    }>;
};
type GraphologyNodeAttributes<V extends ViewToPrint> = {
    modelRef: Fqn | null;
    deploymentRef: DeploymentFqn | null;
    origin: NodeOf<V>;
    level: number;
    depth: number;
    maxConnectedHierarchyDistance: number;
};
type GraphologyEdgeAttributes<V extends ViewToPrint> = {
    origin: EdgeOf<V>;
    weight: number;
    hierarchyDistance: number;
};
export declare const GraphClusterSpace = 50.1;
export declare abstract class DotPrinter<V extends Pick<ComputedView, 'id' | 'nodes' | 'edges' | 'autoLayout'>> {
    protected readonly view: V;
    protected readonly styles: LikeC4Styles;
    private ids;
    private subgraphs;
    private nodes;
    protected edges: Map<EdgeId, EdgeModel>;
    protected compoundIds: Set<NodeId>;
    protected edgesWithCompounds: Set<EdgeId>;
    protected graphology: Graph<GraphologyNodeAttributes<V>, GraphologyEdgeAttributes<V>>;
    readonly graphvizModel: RootGraphModel;
    constructor(view: V, styles: LikeC4Styles);
    protected get $defaults(): LikeC4StyleDefaults;
    get hasEdgesWithCompounds(): boolean;
    protected get defaultRelationshipColors(): RelationshipColorValues;
    protected postBuild(_G: RootGraphModel): void;
    private build;
    print(): DotSource;
    protected createGraph(): RootGraphModel;
    protected applyNodeAttributes(node: AttributeListModel<'Node', NodeAttributeKey>): void;
    protected applyEdgeAttributes(edge: AttributeListModel<'Edge', EdgeAttributeKey>): void;
    protected checkNodeId(name: string, isCompound?: boolean): string;
    protected generateGraphvizId(node: NodeOf<V>): string;
    protected elementToSubgraph(compound: NodeOf<V>, subgraph: SubgraphModel): SubgraphModel;
    protected elementToNode(element: NodeOf<V>, node: NodeModel): NodeModel;
    /**
     * ElementView and DynamicView have different implementation
     */
    protected abstract addEdge(edge: EdgeOf<V>, G: RootGraphModel): EdgeModel | null;
    protected leafElements(parentId: NodeId | null): NodeOf<V>[];
    protected descendants(parentId: NodeId | null): NodeOf<V>[];
    protected computedNode(id: NodeId): any;
    protected getGraphNode(id: NodeId): any;
    protected getSubgraph(id: NodeId): any;
    /**
     * In case edge has a cluster as endpoint,
     * pick nested node to use as endpoint
     */
    protected edgeEndpoint(endpointId: NodeId, pickFromCluster: (data: NodeOf<V>[]) => NodeOf<V> | undefined): [NodeOf<V>, NodeModel, string | undefined];
    protected findInternalEdges(parentId: NodeId | null): EdgeOf<V>[];
    protected withoutCompoundEdges(element: NodeOf<V>): NodeOf<V>;
    protected assignGroups(): void;
    /**
     * Use coordinates from given diagram as initial position for nodes
     * (try to keep existing layout as much as possible)
     */
    applyManualLayout({ height, ...layout }: ApplyManualLayoutData): this;
}
export {};
