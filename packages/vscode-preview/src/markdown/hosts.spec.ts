// @vitest-environment jsdom
import morphdom from 'morphdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HostOptions } from '../../markdown-protocol.ts'
import { HostManager, isReady, markReady, unmarkReady } from './hosts.ts'

function morphContent(doc: Document, container: Element, nextHtml: string): void {
  const incoming = doc.createElement('div')
  incoming.innerHTML = nextHtml
  morphdom(container, incoming, {
    childrenOnly: true,
    onBeforeElUpdated(fromEl, toEl) {
      // Simulate VS Code markdown preview domEval keeping host shadow roots
      if (fromEl.tagName === 'SCRIPT' && toEl.tagName === 'SCRIPT') {
        fromEl.textContent = toEl.textContent
        return false
      }
      return true
    },
  })
}

const DEFAULT_OPTS: HostOptions = {
  project: 'shop',
  viewId: 'index',
  model: 'likec4-model-shop-123456',
  browser: true,
  variant: 'diagram',
  scheme: 'auto',
  maxHeight: 500,
  panZoom: false,
}

function renderHostHtml(id: string, hash: string, state = 'ok'): string {
  const optsAttr = JSON.stringify(DEFAULT_OPTS).replace(/"/g, '&quot;')
  return `<div class="likec4-view" id="${id}" data-likec4-opts="${optsAttr}"><script type="application/json">${
    JSON.stringify({ hash, state })
  }</script></div>`
}

describe('HostManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>'
  })

  it('mounts once, skips identical morphs, updates in-place on model change, and unmounts on removal', () => {
    const doc = document
    const content = doc.getElementById('content')!

    const mountCount = vi.fn<(container: Element) => void>()
    const renderCount = vi.fn<(node: unknown) => void>()
    const unmountCount = vi.fn<() => void>()
    let modelHash = 'm1'

    const manager = new HostManager(doc, {
      createRoot(container) {
        mountCount(container)
        return {
          render: (node) => renderCount(node),
          unmount: () => unmountCount(),
        }
      },
      model: () => ({ hash: modelHash }),
      view: (input) => `${input.hostId}:${input.data.hash}:${input.model?.hash}`,
    })

    content.innerHTML = `<p>Intro</p>${renderHostHtml('likec4-shop-index-1', 'h1')}`
    manager.scan()

    const host = doc.getElementById('likec4-shop-index-1')!
    expect(mountCount).toHaveBeenCalledTimes(1)
    expect(renderCount).toHaveBeenCalledTimes(1)
    expect(isReady(host)).toBe(false)
    markReady(host)
    expect(isReady(host)).toBe(true)

    // Unrelated markdown edit: morphdom updates paragraph only
    morphContent(doc, content, `<p>Intro edited</p>${renderHostHtml('likec4-shop-index-1', 'h1')}`)
    manager.scan()
    expect(doc.getElementById('likec4-shop-index-1')).toBe(host)
    expect(mountCount).toHaveBeenCalledTimes(1)
    expect(renderCount).toHaveBeenCalledTimes(1)
    expect(isReady(host)).toBe(true)

    // LikeC4 model edit: re-renders in-place without unmounting/remounting root
    modelHash = 'm2'
    morphContent(doc, content, `<p>Intro edited</p>${renderHostHtml('likec4-shop-index-1', 'h2')}`)
    manager.scan()
    expect(doc.getElementById('likec4-shop-index-1')).toBe(host)
    expect(mountCount).toHaveBeenCalledTimes(1)
    expect(renderCount).toHaveBeenCalledTimes(2)
    expect(unmountCount).not.toHaveBeenCalled()

    unmarkReady(host)
    expect(isReady(host)).toBe(false)

    // Removing the block (or disabling setting) unmounts cleanly
    morphContent(doc, content, '<p>Intro edited</p>')
    manager.scan()
    expect(unmountCount).toHaveBeenCalledTimes(1)
    expect(manager.entries.size).toBe(0)
  })
})
