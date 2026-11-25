// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov

import { setTimeout as sleep } from 'node:timers/promises'
import PQueue from 'p-queue'
import { clamp } from 'remeda'

/** Notifications from the queue, used for logging. */
export type ScreenshotQueueEvents<T> = {
  /** Called before a retry of a failed task, after the backoff is chosen. */
  onRetry?: (task: T, attempt: number, delayMs: number) => void
  /** Called on every failed attempt. */
  onFailure?: (task: T, error: unknown, attempt: number) => void
}

export type ScreenshotQueueOptions<T, P> = ScreenshotQueueEvents<T> & {
  /** Max number of tasks processed in parallel; at most this many pages are open. */
  concurrency: number
  /** Max attempts per task, 1 means no retry. */
  maxAttempts: number
  /**
   * Creates a page.
   * A failure here means the browser is unusable: the queue is aborted with this error.
   */
  newPage: () => Promise<P>
  /** Closes a page: after a failed attempt, or when the queue is drained. */
  closePage: (page: P) => void
  /** Processes the task on the page; throws to fail the attempt. */
  run: (page: P, task: T) => Promise<void>
  /** Backoff before the given attempt (2 and later); defaults to 200ms per attempt, at most 1s. */
  retryDelayMs?: (attempt: number) => number
}

export type ScreenshotQueueResult<T> = {
  succeeded: T[]
  failed: Array<{ task: T; error: unknown }>
}

const defaultRetryDelay = (attempt: number) => clamp(attempt * 200, { min: 200, max: 1000 })

/**
 * Queue of screenshots on top of `p-queue`: tasks are pushed while earlier ones are being captured.
 *
 * Pages are pooled and reused between tasks, at most `concurrency` of them.
 * A failed attempt discards its page and puts the task at the end of the queue,
 * until `maxAttempts` is reached.
 * Call {@link ScreenshotQueue.drain} after the last {@link ScreenshotQueue.push} to wait for the results.
 */
export class ScreenshotQueue<T, P> {
  readonly #options: ScreenshotQueueOptions<T, P>
  readonly #queue: PQueue
  /** Pages that are open and not used by a running task. */
  readonly #idlePages: P[] = []
  readonly #succeeded: T[] = []
  readonly #failed: Array<{ task: T; error: unknown }> = []
  #aborted: { error: unknown } | null = null
  #closed = false

  constructor(options: ScreenshotQueueOptions<T, P>) {
    if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
      throw new Error('concurrency must be a positive integer')
    }
    if (options.maxAttempts < 1) {
      throw new Error('maxAttempts must be >= 1')
    }
    this.#options = options
    this.#queue = new PQueue({ concurrency: options.concurrency })
  }

  /** Adds a task to the end of the queue. */
  push(task: T): void {
    if (this.#closed) {
      throw new Error('ScreenshotQueue is closed')
    }
    this.#enqueue(task, 1)
  }

  /** Stops accepting tasks and waits until all are processed; rejects if the queue was aborted. */
  async drain(): Promise<ScreenshotQueueResult<T>> {
    this.#closed = true
    try {
      // Retries are added before the failed attempt settles, so idle means all attempts are done
      await this.#queue.onIdle()
    } finally {
      for (const page of this.#idlePages.splice(0)) {
        this.#options.closePage(page)
      }
    }
    if (this.#aborted) {
      throw this.#aborted.error
    }
    return {
      succeeded: [...this.#succeeded],
      failed: [...this.#failed],
    }
  }

  #enqueue(task: T, attempt: number): void {
    if (this.#aborted) {
      return
    }
    void this.#queue.add(async () => {
      // Yield to the event loop to avoid blocking
      await Promise.resolve().then(() => undefined)
      await this.#attempt(task, attempt)
    })
  }

  async #attempt(task: T, attempt: number): Promise<void> {
    const { newPage, closePage, run, maxAttempts, onFailure, onRetry, retryDelayMs = defaultRetryDelay } = this.#options
    if (this.#aborted) {
      return
    }
    if (attempt > 1) {
      const delayMs = retryDelayMs(attempt)
      onRetry?.(task, attempt, delayMs)
      await sleep(delayMs)
    }

    let page = this.#idlePages.pop()
    if (page === undefined) {
      try {
        page = await newPage()
      } catch (error) {
        this.#abort(error)
        return
      }
    }

    try {
      await run(page, task)
      this.#succeeded.push(task)
      this.#idlePages.push(page)
    } catch (error) {
      // Fresh page for the next attempt
      closePage(page)
      onFailure?.(task, error, attempt)
      if (attempt < maxAttempts) {
        this.#enqueue(task, attempt + 1)
      } else {
        this.#failed.push({ task, error })
      }
    }
  }

  #abort(error: unknown): void {
    this.#aborted ??= { error }
    this.#queue.clear()
  }
}
