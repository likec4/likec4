import { describe, expect, it } from 'vitest'
import { calcSceneOffset } from './align'

const pt = (x: number, y: number) => ({ x, y })

describe('calcSceneOffset', () => {
  it('returns zero when the scenes share no elements', () => {
    const out = new Map([['a', pt(0, 0)]])
    const inc = new Map([['b', pt(500, 500)]])
    expect(calcSceneOffset(out, inc, 'anchored')).toEqual(pt(0, 0))
  })

  it('pins exactly when one element is shared', () => {
    const out = new Map([['a', pt(100, 200)]])
    const inc = new Map([['a', pt(400, 50)]])
    expect(calcSceneOffset(out, inc, 'anchored')).toEqual(pt(-300, 150))
  })

  it('aligns centroids when several elements are shared', () => {
    // outgoing centroid (10, 10); incoming centroid (110, 60)
    const out = new Map([['a', pt(0, 0)], ['b', pt(20, 20)]])
    const inc = new Map([['a', pt(100, 50)], ['b', pt(120, 70)], ['c', pt(999, 999)]])
    expect(calcSceneOffset(out, inc, 'anchored')).toEqual(pt(-100, -50))
  })

  it('forces zero in independent mode even when elements are shared', () => {
    const out = new Map([['a', pt(100, 200)]])
    const inc = new Map([['a', pt(400, 50)]])
    expect(calcSceneOffset(out, inc, 'independent')).toEqual(pt(0, 0))
  })

  it('rounds to whole pixels', () => {
    const out = new Map([['a', pt(0, 0)], ['b', pt(1, 1)]])
    const inc = new Map([['a', pt(10, 10)], ['b', pt(11, 12)]])
    const offset = calcSceneOffset(out, inc, 'anchored')
    expect(Number.isInteger(offset.x)).toBe(true)
    expect(Number.isInteger(offset.y)).toBe(true)
  })
})
