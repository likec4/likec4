import { describe, expect, it } from 'vitest'
import { PendingMove } from './pendingMove'

describe('PendingMove', () => {
  it('keeps a newer move to the same row when an older one gives up', () => {
    const pending = new PendingMove()
    // ArrowDown twice on the last row: both moves clamp to row 4
    const first = pending.next()
    pending.set(first, { col: 'el', k: 4 })
    const second = pending.next()
    pending.set(second, { col: 'el', k: 4 })

    // retries of the first move run out
    pending.giveUp(first)
    expect(pending.get()).toEqual({ col: 'el', k: 4, id: second })

    pending.giveUp(second)
    expect(pending.get()).toBeNull()
  })

  it('ends the move when focus reaches its row', () => {
    const pending = new PendingMove()
    pending.set(pending.next(), { col: 'vw', k: 2 })

    pending.reached('vw', 1)
    expect(pending.get()).not.toBeNull()

    pending.reached('vw', 2)
    expect(pending.get()).toBeNull()
  })
})
