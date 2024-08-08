import {
  type DependenciesComparator,
  type EffectHook,
  useCustomCompareEffect,
  useFirstMountState
} from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, type EffectCallback } from 'react'

const noop = () => {}

export const depsShallowEqual: DependenciesComparator = (d1, d2) => {
  if (d1 === d2) {
    return true
  }
  if (d1.length !== d2.length) {
    return false
  }
  for (const [i, element] of d1.entries()) {
    if (!shallowEqual(element, d2[i])) {
      return false
    }
  }
  return true
}

export function useUpdateEffect<
  Callback extends EffectCallback = EffectCallback,
  Deps extends DependencyList = DependencyList
>(
  callback: Callback,
  deps: Deps,
  equalityFn?: DependenciesComparator<Deps>,
  effectHook?: EffectHook<Callback, Deps>
) {
  const isFirstMount = useFirstMountState()
  useCustomCompareEffect(
    isFirstMount ? noop as Callback : callback,
    deps,
    equalityFn ?? depsShallowEqual,
    effectHook
  )
}
