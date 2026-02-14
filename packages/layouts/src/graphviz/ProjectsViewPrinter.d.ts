import type { ComputedProjectEdge, ComputedProjectNode, ComputedProjectsView } from '@likec4/core/compute-view';
import type { EdgeModel, NodeModel, RootGraphModel } from 'ts-graphviz';
import { DotPrinter } from './DotPrinter';
export declare class ProjectsViewPrinter extends DotPrinter<ComputedProjectsView> {
    static toDot(view: ComputedProjectsView): Tagged<string, "DotSource">;
    constructor(view: ComputedProjectsView);
    protected createGraph(): RootGraphModel;
    protected elementToNode(element: ComputedProjectNode, node: NodeModel): NodeModel;
    protected addEdge(edge: ComputedProjectEdge, G: RootGraphModel): EdgeModel | null;
}
