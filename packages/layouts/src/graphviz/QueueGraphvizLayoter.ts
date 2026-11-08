import type { AnyAux } from '@likec4/core'
import type { ComputedProjectsView, LayoutedProjectsView } from '@likec4/core/compute-view'
import { promiseNextTick } from '@likec4/core/utils'
import { rootLogger } from '@likec4/log'
import PQueue from 'p-queue'
import { chunk, only, randomString } from 'remeda'
import { type GraphvizPort, type LayoutResult, type LayoutTaskParams, GraphvizLayouter } from './GraphvizLayoter'
import type { CancellationToken } from './types'

export class QueueGraphvizLayoter extends GraphvizLayouter {
  private queue: PQueue
  private isProcessingBatch = false

  #thislogger = rootLogger.getChild(['layouter-queue'])

  constructor(options?: {
    graphviz?: GraphvizPort

    /**
     * Concurrency limit.
     * Minimum: `1`.
     * @default 2
     */
    concurrency?: number
    /**
     * Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.
     * @default 20_000
     */
    timeout?: number
    /**
     * Whether or not a timeout is considered an exception.
     * @default true
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

  private async runInQueue<T>(fn: () => Promise<T>): Promise<T> {
    const logger = this.#thislogger.getChild(['run', randomString(3).toLowerCase()])
    await this.waitForQueueToShrink(this.queue.concurrency, logger)
    logger.trace`add task to queue`
    return await this.queue.add(async () => {
      // In WASM, we can't run tasks in parallel, and we don't want start task immediately
      await promiseNextTick()
      logger.trace`task started`
      return await fn()
    }, { throwOnTimeout: true })
  }

  override changePort(graphvizPort: GraphvizPort) {
    super.changePort(graphvizPort)
    if (this.queue.concurrency !== graphvizPort.concurrency) {
      this.queue.concurrency = this.graphvizPort.concurrency
      this.#thislogger.debug`set queue concurrency to ${this.graphvizPort.concurrency}`
    }
  }

  override async layout<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<LayoutResult<A>> {
    return await this.runInQueue(() => super.layout(params))
  }

  override async layoutProjectsView(view: ComputedProjectsView): Promise<LayoutedProjectsView> {
    return await this.runInQueue(() => super.layoutProjectsView(view))
  }

  async batchLayout<A extends AnyAux>(
    params: {
      batch: LayoutTaskParams<A>[]
      cancelToken?: CancellationToken | undefined
      onSuccess?: (task: LayoutTaskParams<A>, result: LayoutResult<A>) => void
      onError?: (task: LayoutTaskParams<A>, error: unknown) => void
    },
    logger = this.#thislogger.getChild(['batch', randomString(3).toLowerCase()]),
  ): Promise<LayoutResult<A>[]> {
    if (params.batch.length === 0) {
      logger.trace`empty batch`
      return []
    }
    const onlyOneTask = only(params.batch)
    if (onlyOneTask) {
      logger.trace`only one task in batch, adding to queue`
      return await this.queue.add(async () => {
        // In WASM, we can't run tasks in parallel, and we don't want start task immediately
        await promiseNextTick()
        try {
          const result = await super.layout(onlyOneTask)
          params.onSuccess?.(onlyOneTask, result)
          return [result]
        } catch (error) {
          logger.warn(`layout view ${onlyOneTask.view.id} failed`, { error })
          if (params.onError) {
            return params.onError(onlyOneTask, error) as never
          }
          // Re-throw to propagate the error
          throw error
        }
      }, { throwOnTimeout: true })
    }

    if (this.isProcessingBatch) {
      logger.trace`wait for previous layouts to finish`
      // wait for any previous layout to finish
      await this.queue.onIdle()
      // this batch may have been cancelled while waiting for previous batch to finish
      if (params.cancelToken?.isCancellationRequested) {
        logger.trace`cancellation requested`
        return []
      }
      logger.trace`retry`
      // recursively call batchLayout (to prevent batches from running in parallel)
      return await this.batchLayout(params)
    }
    try {
      this.isProcessingBatch = true

      const concurrency = this.queue.concurrency

      // Back pressure: wait until queue size is small enough to process this batch
      await this.waitForQueueToShrink(concurrency, logger)

      logger.trace`starting, batch size: ${params.batch.length}, concurrency: ${concurrency}`

      const results = [] as LayoutResult<A>[]

      let chunkIndex = 0
      const chunkSize = Math.max(concurrency + 1, 4)

      // If chunkSize is greater than or equal to the batch length, process the entire batch as one chunk
      const chunks = chunkSize >= params.batch.length ? [params.batch] : chunk(params.batch, chunkSize)

      for (const achunk of chunks) {
        chunkIndex++
        if (chunks.length > 1) {
          logger.trace`processing chunk ${chunkIndex} of ${chunks.length} (chunk size: ${achunk.length})`
        }
        await this.queue.addAll(
          achunk.map(task => async ({ signal }) => {
            // In WASM, we can't run tasks in parallel, and we don't want start task immediately
            await promiseNextTick()
            if (signal?.aborted) {
              logger.warn`layout view ${task.view.id} cancelled due to timeout`
              params.onError?.(task, new Error('Timeout'))
              return
            }
            try {
              const result = await super.layout(task)
              results.push(result)
              params.onSuccess?.(task, result)
              return result
            } catch (error) {
              logger.warn(`layout view ${task.view.id} failed`, { error })
              if (params.onError) {
                return params.onError(task, error)
              }
              // Re-throw to propagate the error
              throw error
            }
          }),
          { throwOnTimeout: true },
        )
        // this batch may have been cancelled
        if (params.cancelToken?.isCancellationRequested) {
          logger.trace`cancellation requested`
          return results
        }
      }
      logger.trace`batch layout done`
      return results
    } catch (error) {
      logger.error(`Batch layout failed`, { error })
      throw error
    } finally {
      this.isProcessingBatch = false
    }
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

  /**
   * Custom backpressure
   * (basically allow same amount of tasks to be in queue as concurrency)
   */
  private async waitForQueueToShrink(
    concurrency = this.queue.concurrency,
    logger = this.#thislogger,
  ) {
    if (this.queue.size > concurrency + 2) {
      logger
        .trace`limit reached. queue size: ${this.queue.size}, running: ${this.queue.pending}, waiting shrink to ${concurrency}`
      await this.queue.onSizeLessThan(concurrency + 1)
    }
  }

  override dispose(): void {
    this.queue.clear()
    super.dispose()
  }
}
