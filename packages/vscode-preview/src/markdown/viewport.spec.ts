// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearOtherDocuments,
  fitViewport,
  isViewportUsable,
  loadViewport,
  makeViewportSaver,
  positionSnapshots,
  saveViewport,
  snapshotBounds,
} from './viewport.ts'

describe('viewport helpers', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    document.body.innerHTML = ''
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists viewports scoped by document key and clears stale docs', () => {
    saveViewport('doc-a', 'host-1', { x: 10, y: 20, zoom: 0.8, w: 600, h: 400 })
    saveViewport('doc-b', 'host-1', { x: 30, y: 40, zoom: 1, w: 600, h: 400 })
    expect(loadViewport('doc-a', 'host-1')).toEqual({ x: 10, y: 20, zoom: 0.8, w: 600, h: 400 })

    clearOtherDocuments('doc-a')
    expect(loadViewport('doc-a', 'host-1')).not.toBeNull()
    expect(loadViewport('doc-b', 'host-1')).toBeNull()
  })

  it('rejects off-screen saved viewports via isViewportUsable', () => {
    const bounds = { x: 0, y: 0, width: 300, height: 200 }
    expect(isViewportUsable({ x: 50, y: 50, zoom: 1, w: 400, h: 300 }, bounds)).toBe(true)
    expect(isViewportUsable({ x: -1000, y: 0, zoom: 1, w: 200, h: 200 }, bounds)).toBe(false)
  })

  it('positions static snapshots to match fitViewport', () => {
    document.body.innerHTML =
      `<div class="likec4-view" id="h1" data-likec4-opts='{"panZoom":false}'><svg class="likec4-static" data-bounds="0 0 400 200"></svg></div>`
    const svg = document.querySelector('svg.likec4-static')!
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 432,
      height: 232,
      top: 0,
      left: 0,
      right: 432,
      bottom: 232,
      toJSON: () => ({}),
    })

    expect(snapshotBounds(svg)).toEqual({ x: 0, y: 0, width: 400, height: 200 })
    positionSnapshots('doc-1')

    const expected = fitViewport({ x: 0, y: 0, width: 400, height: 200 }, 432, 232)
    expect(svg.getAttribute('viewBox')).toBe(
      `${-expected.x / expected.zoom} ${-expected.y / expected.zoom} ${432 / expected.zoom} ${232 / expected.zoom}`,
    )
  })

  it('throttles capture-phase viewport saves and cleans up listeners', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const cleanup = makeViewportSaver(host, 'doc-1', 'h1', () => ({ x: 12, y: 34, zoom: 0.9 }))

    host.dispatchEvent(new Event('wheel'))
    vi.advanceTimersByTime(250)
    expect(loadViewport('doc-1', 'h1')).toMatchObject({ x: 12, y: 34, zoom: 0.9 })

    cleanup()
    window.sessionStorage.clear()
    host.dispatchEvent(new Event('wheel'))
    vi.advanceTimersByTime(250)
    expect(loadViewport('doc-1', 'h1')).toBeNull()
  })
})
