import type { AnyAux, ComputedDeploymentView, ComputedEdge, ComputedNode } from '@likec4/core';
import type { EdgeModel, RootGraphModel, SubgraphModel } from 'ts-graphviz';
import { DotPrinter } from './DotPrinter';
export declare class DeploymentViewPrinter<A extends AnyAux> extends DotPrinter<ComputedDeploymentView<A>> {
    protected createGraph(): RootGraphModel;
    protected postBuild(G: RootGraphModel): void;
    protected elementToSubgraph(compound: ComputedNode, subgraph: SubgraphModel): SubgraphModel;
    addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null;
}
