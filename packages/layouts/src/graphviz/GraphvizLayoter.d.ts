import { type AnyAux, type aux, type ComputedView, type DiagramView, LikeC4Styles } from '@likec4/core';
import type { ComputedProjectsView, LayoutedProjectsView } from '@likec4/core/compute-view';
import type { DotSource } from './types';
import type { GraphvizJson } from './types-dot';
export interface GraphvizPort extends Disposable {
    get concurrency(): number;
    unflatten(dot: DotSource): Promise<DotSource>;
    acyclic(dot: DotSource): Promise<DotSource>;
    layoutJson(dot: DotSource): Promise<string>;
    svg(dot: DotSource): Promise<string>;
    dispose(): void;
}
export type LayoutTaskParams<A extends aux.Any = aux.Any> = {
    view: ComputedView<A>;
    styles: LikeC4Styles;
};
export type LayoutResult<A extends aux.Any = aux.Any> = {
    dot: DotSource;
    diagram: DiagramView<A>;
};
export declare class GraphvizLayouter implements Disposable {
    private graphviz;
    constructor(graphviz?: GraphvizPort);
    dispose(): void;
    [Symbol.dispose](): void;
    get graphvizPort(): GraphvizPort;
    changePort(graphviz: GraphvizPort): void;
    dotToJson(dot: DotSource): Promise<GraphvizJson>;
    layout<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<LayoutResult<A>>;
    svg<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<{
        svg: string;
        dot: Tagged<string, "DotSource">;
    }>;
    dot<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<DotSource>;
    layoutProjectsView(view: ComputedProjectsView): Promise<LayoutedProjectsView>;
}
