import type { AnyAux } from '@likec4/core';
import type { ComputedProjectsView, LayoutedProjectsView } from '@likec4/core/compute-view';
import { type GraphvizPort, type LayoutResult, type LayoutTaskParams, GraphvizLayouter } from './GraphvizLayoter';
import type { CancellationToken } from './types';
export declare class QueueGraphvizLayoter extends GraphvizLayouter {
    private queue;
    private isProcessingBatch;
    constructor(options?: {
        graphviz?: GraphvizPort;
        /**
         * Concurrency limit.
         * Minimum: `1`.
         * @default 2
         */
        concurrency?: number;
        /**
         * Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.
         * @default 20_000
         */
        timeout?: number;
        /**
         * Whether or not a timeout is considered an exception.
         * @default true
         */
        throwOnTimeout?: boolean;
    });
    private runInQueue;
    changePort(graphvizPort: GraphvizPort): void;
    layout<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<LayoutResult<A>>;
    layoutProjectsView(view: ComputedProjectsView): Promise<LayoutedProjectsView>;
    batchLayout<A extends AnyAux>(params: {
        batch: LayoutTaskParams<A>[];
        cancelToken?: CancellationToken | undefined;
        onSuccess?: (task: LayoutTaskParams<A>, result: LayoutResult<A>) => void;
        onError?: (task: LayoutTaskParams<A>, error: unknown) => void;
    }): Promise<LayoutResult<A>[]>;
    dispose(): void;
}
