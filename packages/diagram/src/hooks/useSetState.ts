import { shallowEqual } from 'fast-equals'
import { useCallback, useRef, useState } from 'react'
import type { NonEmptyObject } from 'type-fest'

/**
 * Differs from useState in that:
 * - it uses custom equal function (shallowEqual by default) to determine whether the state has changed.
 * - allows partial updates to the state
 */
export function useSetState<T extends object>(
  initialState: T | (() => T),
  equal?: (a: T, b: T) => boolean,
): readonly [T, (statePartial: NonEmptyObject<Partial<T>> | ((current: T) => NonEmptyObject<Partial<T>>)) => void] {
  const [state, _setState] = useState(initialState)

  const equalFn = equal ?? shallowEqual
  const equalFnRef = useRef(equalFn)
  equalFnRef.current = equalFn

  const setState = useCallback(
    (statePartial: NonEmptyObject<Partial<T>> | ((current: T) => NonEmptyObject<Partial<T>>)) =>
      _setState((current) => {
        const next = {
          ...current,
          ...typeof statePartial === 'function' ? statePartial(current) : statePartial,
        }
        return equalFnRef.current(current, next) ? current : next
      }),
    [],
  )
  return [state, setState] as const
}
