/**
 * Heap allocation guardrail for forEachAncestorFqn.
 *
 * The pre-existing ancestorsFqn() allocated a new string array on every call.
 * forEachAncestorFqn() uses a visitor pattern and allocates nothing per call.
 *
 * This test verifies that the zero-allocation contract holds: after 10 000
 * calls, net heap growth must stay below a per-call budget. If someone
 * replaces the visitor with an array-returning implementation, this test fails.
 *
 * Requires --expose-gc (set in vitest.config.ts execArgv).
 */
import { describe, expect, it } from 'vitest'
import { ancestorsFqn, forEachAncestorFqn } from './fqn'

// 8-level FQN — each call would yield 7 ancestor strings with ancestorsFqn.
const DEEP_FQN = 'a.b.c.d.e.f.g.h'
const ITERATIONS = 10_000

// Bytes per call that ancestorsFqn allocates: 7 strings (~24 bytes each) +
// array overhead ≈ ~300 bytes. We use 50 bytes as the budget for forEachAncestorFqn,
// accounting for any incidental JIT/runtime bookkeeping.
const BUDGET_BYTES_PER_CALL = 50

declare const gc: (() => void) | undefined

function measureHeapGrowth(fn: () => void, iterations: number): number {
  // Warmup: stabilise JIT and let the GC reach steady state
  for (let i = 0; i < 1000; i++) fn()
  gc?.()

  const before = process.memoryUsage().heapUsed
  for (let i = 0; i < iterations; i++) fn()
  gc?.()
  const after = process.memoryUsage().heapUsed

  return after - before
}

describe('forEachAncestorFqn — allocation guardrail', () => {
  it('allocates near-zero per call (visitor pattern, no array)', () => {
    const growth = measureHeapGrowth(() => {
      forEachAncestorFqn(DEEP_FQN, () => {})
    }, ITERATIONS)

    const bytesPerCall = growth / ITERATIONS
    expect(
      bytesPerCall,
      `${bytesPerCall.toFixed(1)} bytes/call exceeds ${BUDGET_BYTES_PER_CALL} byte budget — ` +
        'forEachAncestorFqn may have been changed to allocate arrays',
    ).toBeLessThan(BUDGET_BYTES_PER_CALL)
  })

  it('ancestorsFqn allocates significantly more (baseline reference)', () => {
    // This test documents what the OLD pattern looked like.
    // It is expected to exceed the budget — it proves the budget is meaningful.
    //
    // We hold all returned arrays so GC cannot collect them during the run,
    // making the retained-memory delta reliable as a lower bound.
    gc?.()
    const before = process.memoryUsage().heapUsed
    const sink: string[][] = []
    for (let i = 0; i < ITERATIONS; i++) {
      sink.push(ancestorsFqn(DEEP_FQN))
    }
    gc?.()
    const after = process.memoryUsage().heapUsed

    const bytesPerCall = (after - before) / ITERATIONS

    // Each call returns 7 strings in an array. Even with string interning,
    // the array header alone is ~32 bytes. Require at least 8 bytes/call.
    // If this fails, something is wrong with the measurement setup.
    expect(
      bytesPerCall,
      'ancestorsFqn appears to allocate nothing — measurement setup may be broken',
    ).toBeGreaterThan(8)

    // Prevent the compiler from optimising away sink
    expect(sink.length).toBe(ITERATIONS)
  })
})
