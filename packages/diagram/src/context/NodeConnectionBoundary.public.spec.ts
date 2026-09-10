import { describe, expect, it } from 'vitest'
import { useNodeConnectionBoundaryResolver as publicHook } from '../index'
import { useNodeConnectionBoundaryResolver as internalHook } from './NodeConnectionBoundary'

describe('useNodeConnectionBoundaryResolver public API', () => {
  it('exports the boundary resolver hook from the package root', () => {
    expect(publicHook).toBe(internalHook)
  })
})
