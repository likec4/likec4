import { describe, expect, it } from 'vitest'
import { useDiagramCompareLayout as publicHook } from '../index'
import { useDiagramCompareLayout as internalHook } from './useDiagramCompareLayout'

describe('useDiagramCompareLayout public API', () => {
  it('exports the built-in manual-layout controller from the package root', () => {
    expect(publicHook).toBe(internalHook)
  })
})
