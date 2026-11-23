import { type FocusEvent, type RefObject, useCallback, useRef } from 'react'
import { PendingMove } from './pendingMove'
import type { Column } from './ResultRows'

/**
 * Brings row `k` of a column into view and focuses it; returns the row it went to, null for an empty column.
 * Calls `giveUp` if the row could not be focused after all
 */
type Focuser = (k: number, giveUp: () => void) => number | null

export type RegisterFocus = (col: Column, focus: Focuser | null) => void

/**
 * Keyboard focus across the result columns.
 * Virtualized columns register a focuser, other rows are found in the container by `data-col` and `data-k`
 */
export function useRowFocus(containerRef: RefObject<HTMLElement | null>) {
  const focusers = useRef(new Map<Column, Focuser>())
  // row that is being scrolled into view, so fast repeated keys continue from it
  const pending = useRef(new PendingMove()).current

  const registerFocus: RegisterFocus = useCallback((col, focus) => {
    if (focus) focusers.current.set(col, focus)
    else focusers.current.delete(col)
  }, [])

  const focusRow = useCallback((col: Column, k: number): boolean => {
    const focus = focusers.current.get(col)
    if (focus) {
      const id = pending.next()
      // ends this move, unless a newer move replaced it
      const target = focus(k, () => pending.giveUp(id))
      const targetRow = target === null
        ? null
        : containerRef.current?.querySelector(`[data-col="${col}"][data-k="${target}"]`)
      // no focus event comes for a row that already has focus, nothing to wait for
      pending.set(
        id,
        target === null || (targetRow && targetRow === document.activeElement) ? null : { col, k: target },
      )
      return target !== null
    }
    const rows = containerRef.current?.querySelectorAll<HTMLElement>(`[data-col="${col}"]`)
    if (!rows || rows.length === 0) {
      return false
    }
    const row = rows[Math.max(0, Math.min(k, rows.length - 1))]
    row?.focus()
    row?.scrollIntoView({ block: 'nearest' })
    return true
  }, [containerRef])

  /**
   * Column and index of the focused row, or of the row still being scrolled to
   */
  const rowOf = useCallback((row: HTMLElement): { col: Column; k: number } => {
    const col = row.dataset['col'] as Column
    const target = pending.get()
    const k = target?.col === col ? target.k : Number(row.dataset['k'])
    return { col, k }
  }, [])

  /**
   * Handlers for the container: a click or the focus reaching the pending row ends the pending move
   */
  const containerProps = {
    onPointerDown: () => {
      pending.clear()
    },
    onFocus: (e: FocusEvent) => {
      const target = e.target
      if (target instanceof HTMLElement && target.dataset['col']) {
        pending.reached(target.dataset['col'] as Column, Number(target.dataset['k']))
      }
    },
  }

  return { registerFocus, focusRow, rowOf, containerProps }
}
