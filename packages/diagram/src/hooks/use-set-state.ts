'use client'
import { shallowEqual } from 'fast-equals'
import { useCallback, useState } from 'react'

export function useSetState<T extends Record<string, any>>(initialState: T | (() => T)) {
  const [state, _setState] = useState(initialState)
  const setState = useCallback(
    (statePartial: Partial<T> | ((current: T) => Partial<T>)) =>
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
