import type { GraphvizPort } from '../GraphvizLayoter';
import type { DotSource } from '../types';
export declare class GraphvizWasmAdapter implements GraphvizPort {
    private static _graphviz;
    /**
     * Workaround for graphviz wasm memory issues
     * After each N operations unload the wasm and reload it
     */
    private static opsCount;
    get concurrency(): number;
    dispose(): void;
    [Symbol.dispose](): void;
    private graphviz;
    private attempt;
    unflatten(dot: DotSource): Promise<DotSource>;
    acyclic(dot: DotSource): Promise<DotSource>;
    layoutJson(dot: DotSource): Promise<string>;
    svg(dot: DotSource): Promise<string>;
}
