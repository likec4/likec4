import {
  type DependenciesComparator,
  type EffectHook,
  useCustomCompareEffect,
  useFirstMountState
} from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, type EffectCallback } from 'react'

const noop = () => {}

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
    equalityFn ?? shallowEqual,
    effectHook
  )
}
