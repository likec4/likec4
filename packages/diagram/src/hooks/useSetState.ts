import { shallowEqual } from 'fast-equals'
import { useCallback, useState } from 'react'
import type { NonEmptyObject } from 'type-fest'

export function useSetState<T extends object>(initialState: T | (() => T)) {
  const [state, _setState] = useState(initialState)
  const setState = useCallback(
    (statePartial: NonEmptyObject<Partial<T>> | ((current: T) => NonEmptyObject<Partial<T>>)) =>
      _setState((current) => {
        const next = {
          ...current,
          ...typeof statePartial === 'function' ? statePartial(current) : statePartial
        }
        return shallowEqual(current, next) ? current : next
      }),
    []
  )
  return [state, setState] as const
}
