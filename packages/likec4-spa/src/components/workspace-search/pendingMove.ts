import type { Column } from './ResultRows'

export interface PendingTarget {
  readonly col: Column
  readonly k: number
}

/**
 * Keyboard move to a row that is still being scrolled into view,
 * so fast repeated keys continue from it instead of the focused row.
 * Each move has its own id: a late give-up of an older move does not end a newer one,
 * even when both go to the same row.
 */
export class PendingMove {
  private current: (PendingTarget & { readonly id: number }) | null = null
  private seq = 0

  /**
   * Reserves an id for a new move, pass it to {@link set} and {@link giveUp}
   */
  next(): number {
    return ++this.seq
  }

  /**
   * Records the move `id`, or ends any pending move with `null`
   */
  set(id: number, target: PendingTarget | null): void {
    this.current = target ? { ...target, id } : null
  }

  /**
   * The row of the pending move
   */
  get(): PendingTarget | null {
    return this.current
  }

  /**
   * Ends the pending move if it is still the move `id`
   */
  giveUp(id: number): void {
    if (this.current?.id === id) {
      this.current = null
    }
  }

  /**
   * Ends the pending move when focus reaches its row
   */
  reached(col: Column, k: number): void {
    if (this.current?.col === col && this.current.k === k) {
      this.current = null
    }
  }

  clear(): void {
    this.current = null
  }
}
