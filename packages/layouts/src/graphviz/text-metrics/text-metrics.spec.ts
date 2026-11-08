import { afterEach, describe, expect, it } from 'vitest'
import { edgelabel } from '../dot-labels'
import { edgeLabelBox, measureTextWidth, withFontMetrics, wrapEdgeLabel } from './index'

// Reference widths are measured in Chromium with @fontsource-variable/ibm-plex-sans
// and CSS of the edge label (see styled-system/preset/src/recipes/edgeLabel.ts)
describe('measureTextWidth', () => {
  it.each([
    ['fetches via REST', 14, 104.1],
    ['reads/writes', 14, 79.3],
    // ligatures (fi, ffi, fl)
    ['notifies office files flow', 14, 144.6],
  ])('%s (%dpx) ≈ %fpx', (text, size, expected) => {
    expect(measureTextWidth(text, size)).toBeCloseTo(expected, 0)
  })

  it('measures cyrillic with cyrillic face', () => {
    // Chromium: 'шину данных через Kafka' = 167.6px
    expect(measureTextWidth('шину данных через Kafka', 14)).toBeCloseTo(167.6, 0)
  })

  it('estimates characters missing in the font', () => {
    expect(measureTextWidth('🚀', 14)).toBeGreaterThan(14)
    expect(measureTextWidth('発注', 14)).toBeCloseTo(28, 0)
  })
})

describe('wrapEdgeLabel', () => {
  it('keeps short label on one line', () => {
    expect(wrapEdgeLabel('fetches via REST').lines).toEqual(['fetches via REST'])
  })

  it('wraps to balanced lines', () => {
    expect(wrapEdgeLabel('accesses via browser with encrypted VPN connection').lines).toEqual([
      'accesses via browser with',
      'encrypted VPN connection',
    ])
    expect(wrapEdgeLabel('Синхронизирует справочники клиентов и контрагентов каждые 15 минут').lines).toEqual([
      'Синхронизирует справочники',
      'клиентов и контрагентов',
      'каждые 15 минут',
    ])
  })

  it('does not break words when balancing', () => {
    expect(wrapEdgeLabel('Ruft Kundendaten über die Schnittstellenkonfiguration ab').lines).toEqual([
      'Ruft Kundendaten über die',
      'Schnittstellenkonfiguration ab',
    ])
  })

  it('preserves explicit line breaks', () => {
    expect(wrapEdgeLabel('responds with\nconnection details\nto agent').lines).toEqual([
      'responds with',
      'connection details',
      'to agent',
    ])
  })

  it('limits number of lines', () => {
    const label = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ')
    expect(wrapEdgeLabel(label, { maxLines: 3 }).lines).toHaveLength(3)
  })
})

describe('edgeLabelBox', () => {
  it('returns null for empty label', () => {
    expect(edgeLabelBox({ label: '  ', technology: null })).toBeNull()
  })

  it('includes paddings', () => {
    // 104.1 + 2 * 6, 14 * 1.2 + 2 * 4
    expect(edgeLabelBox({ label: 'fetches via REST' })).toEqual({
      label: 'fetches via REST',
      width: 117,
      height: 25,
    })
  })

  it('includes technology', () => {
    // Chromium: 105.8×29.8 + paddings
    expect(edgeLabelBox({ label: 'publishes events', technology: 'JSON' })).toEqual({
      label: 'publishes events',
      width: 118,
      height: 38,
    })
  })

  it('technology only', () => {
    expect(edgeLabelBox({ label: null, technology: 'JSON' })).toMatchObject({ label: null, height: 19 })
  })
})

describe('withFontMetrics', () => {
  const g = globalThis as { OffscreenCanvas?: unknown }
  afterEach(() => {
    delete g.OffscreenCanvas
  })

  it('restores absent global', () => {
    expect('OffscreenCanvas' in g).toBe(false)
    withFontMetrics(() => {
      expect(g.OffscreenCanvas).toBeDefined()
    })
    expect('OffscreenCanvas' in g).toBe(false)
  })

  it('restores existing global, even on error', () => {
    const native = class {}
    g.OffscreenCanvas = native
    expect(() =>
      withFontMetrics(() => {
        expect(g.OffscreenCanvas).not.toBe(native)
        throw new Error('fail')
      })
    ).toThrow('fail')
    expect(g.OffscreenCanvas).toBe(native)
  })
})

describe('edgelabel', () => {
  it('reserves measured size and keeps text', () => {
    expect(edgelabel({ label: 'accesses via browser with encrypted VPN connection', technology: 'HTTPS' }))
      .toMatchInlineSnapshot(
        `"<<TABLE FIXEDSIZE="TRUE" WIDTH="179" HEIGHT="55" BORDER="0" CELLPADDING="0" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">accesses via browser with<BR/>encrypted VPN connection</FONT></TD></TR><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="11">[ HTTPS ]</FONT></TD></TR></TABLE>>"`,
      )
  })
})
