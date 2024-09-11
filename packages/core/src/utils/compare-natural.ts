import compare from 'natural-compare-lite'
import { isString } from 'remeda'


export function compareNatural(a: string | undefined, b: string | undefined): -1 | 0 | 1 {
  if (a === b) return 0
  if (isString(a)) {
    if (isString(b)) {
      return compare(a, b)
    }
    return 1
  }
  return isString(b) ? -1 : 0
}
