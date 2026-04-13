import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleExternalLinkClick, interceptExternalLinks } from './interceptExternalLinks'

function mockAnchor(href: string | null) {
  return {
    closest: vi.fn((selector: string) => selector === 'a[href]' && href !== null ? { getAttribute: () => href } : null),
  }
}

function mockEvent(target: unknown) {
  return { target, preventDefault: vi.fn() } as unknown as MouseEvent
}

describe('handleExternalLinkClick (#2422)', () => {
  const openUrl = vi.fn()

  afterEach(() => openUrl.mockClear())

  it('intercepts https:// links and calls preventDefault', () => {
    const e = mockEvent(mockAnchor('https://example.com'))
    handleExternalLinkClick(e, openUrl)
    expect(openUrl).toHaveBeenCalledWith('https://example.com')
    expect(e.preventDefault).toHaveBeenCalled()
  })

  it('intercepts http:// links', () => {
    const e = mockEvent(mockAnchor('http://example.com'))
    handleExternalLinkClick(e, openUrl)
    expect(openUrl).toHaveBeenCalledWith('http://example.com')
  })

  it('is case-insensitive (HTTPS://)', () => {
    const e = mockEvent(mockAnchor('HTTPS://EXAMPLE.COM'))
    handleExternalLinkClick(e, openUrl)
    expect(openUrl).toHaveBeenCalledWith('HTTPS://EXAMPLE.COM')
  })

  it('walks up to parent anchor via closest()', () => {
    const nested = {
      closest: vi.fn(() => ({ getAttribute: () => 'https://parent.example.com' })),
    }
    handleExternalLinkClick(mockEvent(nested), openUrl)
    expect(openUrl).toHaveBeenCalledWith('https://parent.example.com')
  })

  it('does NOT intercept javascript: links', () => {
    handleExternalLinkClick(mockEvent(mockAnchor('javascript:alert(\'xss\')')), openUrl)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('does NOT intercept data: links', () => {
    handleExternalLinkClick(mockEvent(mockAnchor('data:text/html,<h1>hi</h1>')), openUrl)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('does NOT intercept mailto: links', () => {
    handleExternalLinkClick(mockEvent(mockAnchor('mailto:a@b.com')), openUrl)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('does NOT intercept relative paths', () => {
    handleExternalLinkClick(mockEvent(mockAnchor('/path')), openUrl)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('does NOT intercept file:// links', () => {
    handleExternalLinkClick(mockEvent(mockAnchor('file:///etc/passwd')), openUrl)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('does nothing when target has no closest method', () => {
    handleExternalLinkClick(mockEvent('text node'), openUrl)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('does nothing when target is null', () => {
    handleExternalLinkClick(mockEvent(null), openUrl)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('does nothing when closest returns null (no parent anchor)', () => {
    handleExternalLinkClick(mockEvent(mockAnchor(null)), openUrl)
    expect(openUrl).not.toHaveBeenCalled()
  })
})

describe('interceptExternalLinks wiring', () => {
  it('registers both click and auxclick listeners and cleanup removes them', () => {
    const openUrl = vi.fn()
    const listeners: Record<string, EventListener[]> = {}
    const mockDoc: Pick<Document, 'addEventListener' | 'removeEventListener'> = {
      addEventListener: vi.fn((type: string, handler: EventListener) => {
        listeners[type] = listeners[type] || []
        listeners[type].push(handler)
      }) as Document['addEventListener'],
      removeEventListener: vi.fn((type: string, handler: EventListener) => {
        listeners[type] = (listeners[type] || []).filter(h => h !== handler)
      }) as Document['removeEventListener'],
    }

    const cleanup = interceptExternalLinks(openUrl, mockDoc)

    expect(listeners['click']).toHaveLength(1)
    expect(listeners['auxclick']).toHaveLength(1)

    // Simulate auxclick with an https anchor — verifies the wired handler works
    const anchor = mockAnchor('https://example.com')
    const event = mockEvent(anchor)
    const auxclickHandler = listeners['auxclick']?.[0]
    expect(auxclickHandler).toBeDefined()
    auxclickHandler!(event as unknown as Event)
    expect(openUrl).toHaveBeenCalledWith('https://example.com')

    // Cleanup removes both
    cleanup()
    expect(listeners['click']).toHaveLength(0)
    expect(listeners['auxclick']).toHaveLength(0)
  })
})
