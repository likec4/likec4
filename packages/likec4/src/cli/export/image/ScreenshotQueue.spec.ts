// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov

import { setTimeout as sleep } from 'node:timers/promises'
import { describe, expect, it, vi } from 'vitest'
import { ScreenshotQueue } from './ScreenshotQueue'

type FakePage = { id: number; closed: boolean }

function setup({
  concurrency = 2,
  maxAttempts = 3,
  run = async () => {},
  newPage,
}: {
  concurrency?: number
  maxAttempts?: number
  run?: (page: FakePage, task: string) => Promise<void>
  newPage?: () => Promise<FakePage>
} = {}) {
  const pages: FakePage[] = []
  let running = 0
  let maxRunning = 0
  const queue = new ScreenshotQueue<string, FakePage>({
    concurrency,
    maxAttempts,
    retryDelayMs: () => 0,
    newPage: newPage ?? (async () => {
      const page = { id: pages.length, closed: false }
      pages.push(page)
      return page
    }),
    closePage: page => {
      page.closed = true
    },
    run: async (page, task) => {
      running++
      maxRunning = Math.max(maxRunning, running)
      try {
        await run(page, task)
      } finally {
        running--
      }
    },
  })
  return { queue, pages, maxRunning: () => maxRunning }
}

describe('ScreenshotQueue', () => {
  it('runs tasks in parallel up to concurrency and reuses pages', async () => {
    const { queue, pages, maxRunning } = setup({
      concurrency: 2,
      run: () => sleep(5),
    })
    for (const task of ['a', 'b', 'c', 'd', 'e']) {
      queue.push(task)
    }
    const { succeeded, failed } = await queue.drain()

    expect(succeeded.toSorted()).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(failed).toEqual([])
    expect(maxRunning()).toBe(2)
    expect(pages).toHaveLength(2)
    expect(pages.every(p => p.closed)).toBe(true)
  })

  it('accepts tasks pushed while earlier ones are running', async () => {
    const { queue } = setup({ run: () => sleep(5) })
    queue.push('a')
    await sleep(1)
    queue.push('b')
    const { succeeded } = await queue.drain()
    expect(succeeded.toSorted()).toEqual(['a', 'b'])
  })

  it('retries a failed task on a fresh page', async () => {
    let calls = 0
    const usedPages: FakePage[] = []
    const { queue, pages } = setup({
      concurrency: 1,
      run: async (page, task) => {
        usedPages.push(page)
        if (task === 'flaky' && calls++ === 0) {
          throw new Error('boom')
        }
      },
    })
    queue.push('flaky')
    const { succeeded, failed } = await queue.drain()

    expect(succeeded).toEqual(['flaky'])
    expect(failed).toEqual([])
    expect(usedPages[0]).not.toBe(usedPages[1])
    expect(pages[0]!.closed).toBe(true)
  })

  it('reports a task as failed after maxAttempts', async () => {
    const error = new Error('always')
    const attempts = vi.fn<(task: string) => void>()
    const { queue } = setup({
      maxAttempts: 3,
      run: async (_page, task) => {
        attempts(task)
        if (task === 'bad') {
          throw error
        }
      },
    })
    queue.push('bad')
    queue.push('good')
    const { succeeded, failed } = await queue.drain()

    expect(succeeded).toEqual(['good'])
    expect(failed).toEqual([{ task: 'bad', error }])
    expect(attempts.mock.calls.filter(([t]) => t === 'bad')).toHaveLength(3)
  })

  it('aborts when a page can not be created', async () => {
    const error = new Error('no browser')
    const run = vi.fn<(page: FakePage, task: string) => Promise<void>>()
    const { queue } = setup({
      newPage: () => Promise.reject(error),
      run,
    })
    queue.push('a')
    queue.push('b')
    queue.push('c')
    await expect(queue.drain()).rejects.toBe(error)
    expect(run).not.toHaveBeenCalled()
  })

  it('drains an empty queue', async () => {
    const { queue, pages } = setup()
    await expect(queue.drain()).resolves.toEqual({ succeeded: [], failed: [] })
    expect(pages).toHaveLength(0)
  })

  it('rejects push after drain', async () => {
    const { queue } = setup()
    await queue.drain()
    expect(() => queue.push('a')).toThrow('closed')
  })
})
