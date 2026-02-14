import type { AnyAux, ComputedDynamicView, ComputedEdge } from '@likec4/core';
import type { EdgeModel, RootGraphModel } from 'ts-graphviz';
import { DotPrinter } from './DotPrinter';
export declare class DynamicViewPrinter<A extends AnyAux> extends DotPrinter<ComputedDynamicView<A>> {
    protected postBuild(G: RootGraphModel): void;
    protected addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null;
}
