import type { GraphvizPort } from '../GraphvizLayoter';
import type { DotSource } from '../types';
export declare class GraphvizBinaryAdapter implements GraphvizPort {
    private _dotpath;
    private _unflattenpath;
    constructor(
    /**
     * Path to the binary, e.g. 'dot' or '/usr/bin/dot'
     * If not provided, will be found using `which`.
     */
    dot_path?: string, 
    /**
     * Path to the binary, e.g. 'unflatten' or '/usr/bin/unflatten'
     * If not provided, will be found using `which`.
     */
    unflatten_path?: string);
    dispose(): void;
    [Symbol.dispose](): void;
    get concurrency(): number;
    get dotpath(): any;
    get unflattenpath(): any;
    unflatten(dot: DotSource): Promise<DotSource>;
    layoutJson(dot: DotSource): Promise<string>;
    acyclic(_dot: DotSource): Promise<DotSource>;
    svg(dot: DotSource): Promise<string>;
}
