import { isFunction } from 'remeda'
import { invariant } from '../../errors'

export function ireduce<T, R>(reducer: (acc: R, item: T) => R, initialValue: R): (iterable: Iterable<T>) => R
export function ireduce<T, R>(iterable: Iterable<T>, reducer: (acc: R, item: T) => R, initialValue: R): R
export function ireduce<T, R>(
  arg1: unknown,
  arg2?: unknown,
  arg3?: unknown,
): R | ((iterable: Iterable<T>) => R) {
  const reducer = (arg2 ?? arg1) as (acc: R, item: T) => R
  const initialValue = arg3 ?? arg2
  invariant(isFunction(reducer))

  function _reduce(iter: Iterable<T>): R {
    let acc = initialValue as R
    for (const value of iter) {
      acc = reducer(acc, value)
    }
    return acc
  }

  if (!arg3) {
    return _reduce
  }
  return _reduce(arg1 as Iterable<T>)
}
