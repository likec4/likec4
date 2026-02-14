import type { AnyAux, ComputedEdge, ComputedElementView } from '@likec4/core';
import type { EdgeModel, RootGraphModel } from 'ts-graphviz';
import { DotPrinter } from './DotPrinter';
export declare class ElementViewPrinter<A extends AnyAux> extends DotPrinter<ComputedElementView<A>> {
    protected postBuild(G: RootGraphModel): void;
    private applyExplicitRankBlocks;
    protected addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null;
}
