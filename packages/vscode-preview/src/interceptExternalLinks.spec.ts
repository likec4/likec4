import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleExternalLinkClick, interceptExternalLinks } from './interceptExternalLinks'

function mockAnchor(href: string | null) {
  return {
    closest: vi.fn((selector: string) => selector === 'a[href]' && href !== null ? { getAttribute: () => href } : null),
  }
}

function mockEvent(target: unknown) {
  return { target, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent
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
      closest: vi.fn((selector: string) => {
        if (selector === 'a[href]') {
          return { getAttribute: () => 'https://parent.example.com' }
        }
        return null // not inside an interactive element
      }),
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

  it.each([
    'button',
    '[role="button"]',
    'input',
    'select',
    'textarea',
  ])('skips interactive element inside link: %s', (tag) => {
    const target = {
      closest: vi.fn((selector: string) => {
        // Match the interactiveSelector only when it contains this specific tag
        const selectors = selector.split(',').map(s => s.trim())
        if (selectors.some(s => s === tag || s.includes(tag))) {
          return { tagName: tag.toUpperCase() }
        }
        if (selector === 'a[href]') {
          return { getAttribute: () => 'https://example.com' }
        }
        return null
      }),
    }
    const e = mockEvent(target)
    handleExternalLinkClick(e, openUrl)
    expect(openUrl).not.toHaveBeenCalled()
    // Still prevents anchor navigation (defense-in-depth for webview blank-page bug)
    expect(e.preventDefault).toHaveBeenCalled()
  })

  it('skips interactive element NOT inside a link (no preventDefault)', () => {
    const target = {
      closest: vi.fn((selector: string) => {
        const selectors = selector.split(',').map(s => s.trim())
        if (selectors.some(s => s === 'button')) {
          return { tagName: 'BUTTON' }
        }
        // No parent anchor
        return null
      }),
    }
    const e = mockEvent(target)
    handleExternalLinkClick(e, openUrl)
    expect(openUrl).not.toHaveBeenCalled()
    expect(e.preventDefault).not.toHaveBeenCalled()
  })

  it('also calls stopPropagation on intercepted links', () => {
    const e = {
      ...mockEvent(mockAnchor('https://example.com')),
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent
    handleExternalLinkClick(e, openUrl)
    expect(e.stopPropagation).toHaveBeenCalled()
    expect(openUrl).toHaveBeenCalledWith('https://example.com')
  })
})

describe('interceptExternalLinks wiring', () => {
  it('registers click (capture) and auxclick (bubble) listeners, cleanup removes them', () => {
    const openUrl = vi.fn()
    const calls: Array<{ type: string; capture: boolean; action: 'add' | 'remove' }> = []
    const listeners: Record<string, EventListener[]> = {}
    const mockDoc: Pick<Document, 'addEventListener' | 'removeEventListener'> = {
      addEventListener: vi.fn((type: string, handler: EventListener, options?: boolean | AddEventListenerOptions) => {
        const capture = typeof options === 'boolean' ? options : (options as AddEventListenerOptions)?.capture ?? false
        calls.push({ type, capture, action: 'add' })
        listeners[type] = listeners[type] || []
        listeners[type].push(handler)
      }) as Document['addEventListener'],
      removeEventListener: vi.fn(
        (type: string, handler: EventListener, options?: boolean | EventListenerOptions) => {
          const capture = typeof options === 'boolean' ? options : (options as EventListenerOptions)?.capture ?? false
          calls.push({ type, capture, action: 'remove' })
          listeners[type] = (listeners[type] || []).filter(h => h !== handler)
        },
      ) as Document['removeEventListener'],
    }

    const cleanup = interceptExternalLinks(openUrl, mockDoc)

    expect(listeners['click']).toHaveLength(1)
    expect(listeners['auxclick']).toHaveLength(1)

    // Verify click uses capture phase, auxclick uses bubble
    expect(calls).toContainEqual({ type: 'click', capture: true, action: 'add' })
    expect(calls).toContainEqual({ type: 'auxclick', capture: false, action: 'add' })

    // Simulate auxclick with an https anchor — verifies the wired handler works
    const anchor = mockAnchor('https://example.com')
    const event = mockEvent(anchor)
    const auxclickHandler = listeners['auxclick']?.[0]
    expect(auxclickHandler).toBeDefined()
    auxclickHandler!(event as unknown as Event)
    expect(openUrl).toHaveBeenCalledWith('https://example.com')

    // Cleanup removes both with matching capture flags
    cleanup()
    expect(listeners['click']).toHaveLength(0)
    expect(listeners['auxclick']).toHaveLength(0)
    expect(calls).toContainEqual({ type: 'click', capture: true, action: 'remove' })
    expect(calls).toContainEqual({ type: 'auxclick', capture: false, action: 'remove' })
  })
})
