import { promiseNextTick } from '@likec4/core/utils';
import { rootLogger } from '@likec4/log';
import PQueue from 'p-queue';
import { GraphvizLayouter } from './GraphvizLayoter';
const logger = rootLogger.getChild(['layouter', 'queue']);
export class QueueGraphvizLayoter extends GraphvizLayouter {
    queue;
    isProcessingBatch = false;
    constructor(options) {
        super(options?.graphviz);
        this.queue = new PQueue({
            concurrency: options?.concurrency ?? this.graphvizPort.concurrency,
            timeout: options?.timeout ?? 20_000,
            throwOnTimeout: options?.throwOnTimeout ?? true,
        });
    }
    async runInQueue(fn) {
        if (this.isProcessingBatch) {
            logger.debug `waiting for batch to finish`;
            await this.queue.onIdle();
            await promiseNextTick();
            // recursively call runInQueue (to prevent batches from running in parallel)
            return await this.runInQueue(fn);
        }
        else if (this.queue.size > this.queue.concurrency * 2 + 1) {
            logger
                .debug `task limit reached: ${this.queue.size} (pending: ${this.queue.pending}), waiting queue to shrink to ${this.queue.concurrency}`;
            await this.queue.onSizeLessThan(this.queue.concurrency + 1);
        }
        logger.trace `add task to queue`;
        return await this.queue.add(fn);
    }
    changePort(graphvizPort) {
        super.changePort(graphvizPort);
        if (this.queue.concurrency !== graphvizPort.concurrency) {
            this.queue.concurrency = this.graphvizPort.concurrency;
            logger.debug `set queue concurrency to ${this.graphvizPort.concurrency}`;
        }
    }
    async layout(params) {
        const result = await this.runInQueue(async () => {
            return await super.layout(params);
        });
        if (!result) {
            throw new Error(`QueueGraphvizLayoter: layout failed`);
        }
        return result;
    }
    async layoutProjectsView(view) {
        logger.debug `adding layoutProjectsView task to queue`;
        const result = await this.runInQueue(async () => {
            logger.debug `layouting projects view`;
            return await super.layoutProjectsView(view);
        });
        if (!result) {
            throw new Error(`QueueGraphvizLayoter: layoutProjectsView failed`);
        }
        return result;
    }
    async batchLayout(params) {
        if (this.isProcessingBatch) {
            logger.debug `wait for previous layouts to finish`;
            // wait for any previous layout to finish
            await this.queue.onIdle();
            await promiseNextTick();
            // recursively call batchLayout (to prevent batches from running in parallel)
            return await this.batchLayout(params);
        }
        // this batch may have been cancelled while waiting for previous batch to finish
        if (params.cancelToken?.isCancellationRequested) {
            logger.debug `cancellation requested`;
            return [];
        }
        const concurrency = this.queue.concurrency;
        logger.debug `starting batch layout, size: ${params.batch.length}, concurrency: ${concurrency}`;
        this.isProcessingBatch = true;
        const results = [];
        try {
            for (const task of params.batch) {
                logger.debug `add task for view ${task.view.id}`;
                this.queue
                    .add(async () => {
                    // In WASM, we can't run tasks in parallel, and we don't want start task immediately
                    if (concurrency <= 2) {
                        await promiseNextTick();
                    }
                    return await super.layout(task);
                })
                    .then(result => {
                    if (!result) {
                        params.onError?.(task, new Error(`Layout queue returned null for view ${task.view.id}`));
                        return;
                    }
                    results.push(result);
                    params.onSuccess?.(task, result);
                })
                    .catch(err => {
                    logger.error(`Fail layout view ${task.view.id}`, { err });
                    params.onError?.(task, err);
                });
                if (this.queue.size > concurrency + 2) {
                    logger
                        .debug `task limit reached: ${this.queue.size}, waiting queue to shrink to ${concurrency}`;
                    await this.queue.onSizeLessThan(concurrency + 1);
                    if (params.cancelToken?.isCancellationRequested) {
                        logger.debug `cancellation requested`;
                        break;
                    }
                }
            }
        }
        finally {
            await this.queue.onIdle();
            logger.debug `batch layout done`;
            this.isProcessingBatch = false;
        }
        return results;
    }
    // TODO: deadlocks
    // override async svg<A extends AnyAux>(params: Params<A>) {
    //   return await this.runInQueue('svg', async () => {
    //     return await super.svg(params)
    //   })
    // }
    // override async dot<A extends AnyAux>(params: Params<A>): Promise<DotSource> {
    //   return await this.runInQueue('dot', async () => {
    //     return await super.dot(params)
    //   })
    // }
    dispose() {
        this.queue.clear();
        super.dispose();
    }
}
