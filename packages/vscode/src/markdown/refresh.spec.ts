import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type RefreshHost, RefreshScheduler } from './refresh.ts'

describe('RefreshScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('coalesces multiple project notifications within the delay window', () => {
    const refresh = vi.fn<(reason: string) => void>()
    const host: RefreshHost = {
      documentsReferencing: (keys) => (keys.includes('shop') ? ['file:///ws/README.md'] : []),
      hasOpenPreview: () => true,
      isDocumentOpen: (doc) => doc === 'file:///ws/README.md',
      refresh,
    }
    const scheduler = new RefreshScheduler(host, 5)

    scheduler.projectsChanged(['shop'], 'edit 1')
    scheduler.projectsChanged(['billing'], 'edit 2')
    scheduler.projectsChanged(['shop'], 'edit 1')

    expect(refresh).not.toHaveBeenCalled()
    vi.advanceTimersByTime(5)

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledWith('edit 1; edit 2')
  })

  it('skips refresh when no preview is open or no open document references changed projects', () => {
    const refresh = vi.fn<(reason: string) => void>()
    let hasPreview = false
    let docs = ['file:///ws/README.md']
    const host: RefreshHost = {
      documentsReferencing: () => docs,
      hasOpenPreview: () => hasPreview,
      isDocumentOpen: (doc) => doc === 'file:///ws/README.md',
      refresh,
    }
    const scheduler = new RefreshScheduler(host, 5)

    scheduler.projectsChanged(['shop'], 'no preview')
    vi.advanceTimersByTime(5)
    expect(refresh).not.toHaveBeenCalled()

    hasPreview = true
    docs = ['file:///ws/closed.md']
    scheduler.projectsChanged(['shop'], 'unrelated doc')
    vi.advanceTimersByTime(5)
    expect(refresh).not.toHaveBeenCalled()

    scheduler.refreshAll('config changed')
    vi.advanceTimersByTime(5)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledWith('config changed')
  })

  it('cancels pending timers on dispose', () => {
    const refresh = vi.fn<(reason: string) => void>()
    const scheduler = new RefreshScheduler(
      {
        documentsReferencing: () => ['file:///ws/README.md'],
        hasOpenPreview: () => true,
        isDocumentOpen: () => true,
        refresh,
      },
      10,
    )
    scheduler.projectsChanged(['shop'], 'edit')
    scheduler.dispose()
    vi.advanceTimersByTime(20)
    expect(refresh).not.toHaveBeenCalled()
  })
})
