import {
  type AnyAux,
  promiseNextTick,
} from '@likec4/core'
import { rootLogger } from '@likec4/log'
import PQueue from 'p-queue'
import { type GraphvizPort, type LayoutResult, type LayoutTaskParams, GraphvizLayouter } from './GraphvizLayoter'

const logger = rootLogger.getChild(['layouter', 'queue'])

export class QueueGraphvizLayoter extends GraphvizLayouter {
  private queue: PQueue
  private isProcessingBatch = false

  constructor(options?: {
    graphviz?: GraphvizPort

    /**
    Concurrency limit.

    Minimum: `1`.

    @default 2
    */
    concurrency?: number
    /**
    Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.
    @default 20_000
    */
    timeout?: number
    /**
    Whether or not a timeout is considered an exception.
    @default true
    */
    throwOnTimeout?: boolean
  }) {
    super(options?.graphviz)
    this.queue = new PQueue({
      concurrency: options?.concurrency ?? this.graphvizPort.concurrency,
      timeout: options?.timeout ?? 20_000,
      throwOnTimeout: options?.throwOnTimeout ?? true,
    })
  }

  private async runInQueue<T>(fn: () => Promise<T>): Promise<T | void> {
    if (this.isProcessingBatch) {
      logger.debug`waiting for batch to finish`
      await this.queue.onIdle()
      await promiseNextTick()
      // recursively call runInQueue (to prevent batches from running in parallel)
      return await this.runInQueue(fn)
    } else if (this.queue.size > this.queue.concurrency * 2 + 1) {
      logger
        .debug`task limit reached: ${this.queue.size} (pending: ${this.queue.pending}), waiting queue to shrink to ${this.queue.concurrency}`
      await this.queue.onSizeLessThan(this.queue.concurrency + 1)
    }
    logger.debug`add task to queue`
    return await this.queue.add(fn)
  }

  override changePort(graphvizPort: GraphvizPort) {
    super.changePort(graphvizPort)
    if (this.queue.concurrency !== graphvizPort.concurrency) {
      this.queue.onIdle().finally(() => {
        this.queue.concurrency = this.graphvizPort.concurrency
        logger.debug`set queue concurrency to ${this.graphvizPort.concurrency}`
      })
    }
  }

  override async layout<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<LayoutResult<A>> {
    const result = await this.runInQueue(async () => {
      return await super.layout(params)
    })
    if (!result) {
      throw new Error(`QueueGraphvizLayoter: layout failed`)
    }
    return result
  }

  async batchLayout<A extends AnyAux>(params: {
    batch: LayoutTaskParams<A>[]
    onSuccess?: (task: LayoutTaskParams<A>, result: LayoutResult<A>) => void
    onError?: (task: LayoutTaskParams<A>, error: unknown) => void
  }): Promise<LayoutResult<A>[]> {
    if (this.isProcessingBatch) {
      logger.debug`wait for previous layouts to finish`
      // wait for any previous layout to finish
      await this.queue.onIdle()
      await promiseNextTick()
      // recursively call batchLayout (to prevent batches from running in parallel)
      return await this.batchLayout(params)
    }
    const concurrency = this.queue.concurrency
    logger.debug`starting batch layout, size: ${params.batch.length}, concurrency: ${concurrency}`
    this.isProcessingBatch = true
    const results = [] as LayoutResult<A>[]
    try {
      for (const task of params.batch) {
        logger.debug`add task for view ${task.view.id}`
        this.queue
          .add(async () => {
            await promiseNextTick()
            return await super.layout(task)
          })
          .then(result => {
            if (!result) {
              params.onError?.(task, new Error(`Layout queue returned null for view ${task.view.id}`))
              return
            }
            results.push(result)
            params.onSuccess?.(task, result)
          })
          .catch(err => {
            logger.error(`Fail layout view ${task.view.id}`, { err })
            params.onError?.(task, err)
          })
        if (this.queue.size > concurrency + 2) {
          logger
            .debug`task limit reached: ${this.queue.size}, waiting queue to shrink to ${concurrency}`
          await this.queue.onSizeLessThan(concurrency + 1)
        }
      }
    } finally {
      await this.queue.onIdle()
      logger.debug`batch layout done`
      this.isProcessingBatch = false
    }
    return results
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
}
